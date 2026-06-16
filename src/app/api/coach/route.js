import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import { buildCategorySummary, calculateCategoryBaseline, computeActivityEmission } from '@/lib/calculator';
import Goal from '@/models/Goal';
import { getGridCarbonIntensity } from '@/lib/gridFactors';
import { rateLimit } from '@/lib/rateLimiter';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimit(ip, 10, 60000)) { // 10 requests per minute limit
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, action } = body;

    await connectDB();

    // Fetch user profile and context
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch last 30 days of activities to understand current footprint
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const activities = await ActivityLog.find({
      userId: session.user.id,
      loggedAt: { $gte: oneMonthAgo }
    });

    const summary = buildCategorySummary(activities);
    const baseline = user.baseline?.annualKgCO2e || 0;
    const monthlyTotal = summary.total || 0;

    // Find highest contributor
    const categories = ['transport', 'energy', 'food', 'shopping', 'waste'];
    let highestCategory = 'None';
    let highestValue = 0;
    categories.forEach(cat => {
      if (summary[cat] > highestValue) {
        highestValue = summary[cat];
        highestCategory = cat;
      }
    });

    const diet = user.profile?.diet || 'avg_meat';
    const transportMode = user.profile?.transportMode || 'car_petrol';
    const energySource = user.profile?.energySource || 'grid';

    // Fetch live grid carbon intensity for richer AI advice
    let gridIntensityGperKwh = 233; // default gCO2/kWh
    let gridStatus = 'moderate';
    let gridSource = 'fallback';
    try {
      const gridData = await getGridCarbonIntensity(user.profile?.country, user.profile?.location);
      gridIntensityGperKwh = Math.round(gridData.intensity * 1000);
      gridStatus = gridData.status;
      gridSource = gridData.source;
    } catch { /* non-critical */ }

    // System prompt with user context
    const systemPrompt = `You are a Principal Climate-Tech Expert and AI Sustainability Coach. 
You are advising ${user.name}.
Here is their real carbon profile:
- Annual Carbon Baseline: ${baseline.toFixed(1)} kg CO2e
- Actual Emissions (Last 30 days): ${monthlyTotal.toFixed(1)} kg CO2e
- Highest Emission Category (Last 30 days): ${highestCategory}
- Diet Preference: ${diet.replace('_', ' ')}
- Commuting Transport Mode: ${transportMode.replace('_', ' ')}
- Home Energy Source: ${energySource}
- Live Grid Carbon Intensity: ${gridIntensityGperKwh} gCO2/kWh (${gridStatus}${gridSource === 'live' ? ', LIVE from National Grid API' : ', regional estimate'})

Answer the user concisely and directly. Suggest actionable, realistic modifications. Keep tone positive, scientific, and motivating.
You have tools available to help the user directly: 'log_activity' and 'create_goal'. If the user requests to track, log, or set a goal, use these tools.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      let promptText = '';
      if (action === 'generateWeeklyPlan') {
        promptText = `${systemPrompt}\n\nTask: Generate a personalized 7-day Weekly Action Plan focusing on their biggest driver: ${highestCategory || 'general'}. List 3 high-impact specific actions for this week. Include brief rationales.`;
      } else {
        promptText = `${systemPrompt}\n\nUser Question: ${message}\n\nResponse:`;
      }

      const toolsDefinition = [
        {
          functionDeclarations: [
            {
              name: "log_activity",
              description: "Logs a user activity (e.g. food consumption, transport travel, home energy use) to the database.",
              parameters: {
                type: "OBJECT",
                properties: {
                  category: {
                    type: "STRING",
                    enum: ["transport", "energy", "food", "shopping", "waste"]
                  },
                  subType: {
                    type: "STRING",
                    description: "The specific type, e.g. car_petrol, flight_short, meal_vegan, electricity_grid, general_waste_kg"
                  },
                  amount: {
                    type: "NUMBER",
                    description: "Numerical quantity of activity"
                  },
                  unit: {
                    type: "STRING",
                    description: "Unit (e.g., km, kWh, meals, kg, litres)"
                  },
                  notes: {
                    type: "STRING",
                    description: "Additional text context"
                  }
                },
                required: ["category", "subType", "amount", "unit"]
              }
            },
            {
              name: "create_goal",
              description: "Creates a carbon reduction goal for the user.",
              parameters: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  type: {
                    type: "STRING",
                    enum: ["category_limit", "reduction_percentage", "streak"]
                  },
                  category: {
                    type: "STRING",
                    enum: ["overall", "transport", "energy", "food", "shopping", "waste"]
                  },
                  targetValue: { type: "NUMBER" },
                  targetUnit: { type: "STRING" },
                  endDate: {
                    type: "STRING",
                    description: "ISO date string of target goal end date"
                  }
                },
                required: ["title", "type", "targetValue", "targetUnit", "endDate"]
              }
            }
          ]
        }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            tools: toolsDefinition
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        // Check for function calls
        if (part?.functionCall) {
          const { name, args } = part.functionCall;
          if (name === 'log_activity') {
            const co2e = computeActivityEmission({
              category: args.category,
              subType: args.subType,
              amount: args.amount
            });
            const newLog = await ActivityLog.create({
              userId: session.user.id,
              category: args.category,
              subType: args.subType,
              amount: args.amount,
              unit: args.unit,
              co2e,
              notes: args.notes || 'Logged via AI Agent',
            });
            return NextResponse.json({
              text: `✅ **AI Action Activated**: Logged your **${args.subType.replace(/_/g, ' ')}** activity of **${args.amount} ${args.unit}** (${co2e.toFixed(3)} kg CO₂e recorded).`,
              actionTaken: true
            }, { status: 200 });
          }

          if (name === 'create_goal') {
            const newGoal = await Goal.create({
              userId: session.user.id,
              title: args.title,
              type: args.type,
              category: args.category || 'overall',
              targetValue: args.targetValue,
              targetUnit: args.targetUnit,
              endDate: new Date(args.endDate),
              milestones: [
                { at: 25, label: 'Quarter way there! 🌱' },
                { at: 50, label: 'Halfway to your goal! 🌿' },
                { at: 75, label: 'Three quarters done! 🌳' },
                { at: 100, label: 'Goal Achieved! 🏆' },
              ],
            });
            return NextResponse.json({
              text: `✅ **AI Action Activated**: Created your new carbon reduction goal: **"${args.title}"** (Target: ${args.targetValue} ${args.targetUnit} by ${new Date(args.endDate).toLocaleDateString()}).`,
              actionTaken: true
            }, { status: 200 });
          }
        }

        const responseText = part?.text;
        if (responseText) {
          return NextResponse.json({ text: responseText.trim() }, { status: 200 });
        }
      }
      console.warn('[GEMINI API ERROR] Falling back to rule engine.');
    }

    // --- Dynamic Context-Aware Fallback Rule Engine ---
    let replyText = '';

    if (action === 'generateWeeklyPlan') {
      replyText = `**Your Personalized Weekly Action Plan (Data-Driven):**\n\n`;

      if (highestCategory === 'transport' || (highestCategory === 'None' && transportMode.includes('car'))) {
        replyText += `1. **Eco-Commute (Transport)**: Swap 2 drives in your ${transportMode.replace('_', ' ')} for transit, walking, or cycling. (Savings: ~15 kg CO₂e)\n`;
      } else {
        replyText += `1. **Active Travel**: Swap one short local drive for cycling or walking. (Savings: ~4 kg CO₂e)\n`;
      }

      if (diet === 'high_meat' || diet === 'avg_meat') {
        replyText += `2. **Green Dining (Food)**: Try a fully plant-based meal today instead of your usual ${diet.replace('_', ' ')}. (Savings: ~4.1 kg CO₂e)\n`;
      } else {
        replyText += `2. **Zero Waste Pantry (Food)**: Focus on local organic vegetables and minimize food leftovers. (Savings: ~2 kg CO₂e)\n`;
      }

      if (energySource === 'grid') {
        replyText += `3. **Phantom Power Reduction (Energy)**: Power down standby electronics overnight and adjust thermostat by 1°C. (Savings: ~5% home energy emissions)\n`;
      } else {
        replyText += `3. **Solar Management**: Schedule laundry or high-appliance runs during peak daylight hours to use direct ${energySource} power. (Savings: Peak grid offset)\n`;
      }

      replyText += `\n*Why this plan?* Your last 30 days activity shows ${monthlyTotal.toFixed(1)} kg CO₂e logged. Shifting behaviors in your highest category (${highestCategory !== 'None' ? highestCategory : 'general transport'}) yields the fastest reduction velocity!`;
    } else {
      // Handle user chat message
      const query = (message || '').toLowerCase();

      if (query.includes('food') || query.includes('diet') || query.includes('eat') || query.includes('meat')) {
        if (diet === 'vegan' || diet === 'vegetarian') {
          replyText = `Hello! Since you already maintain a sustainable ${diet} diet, you are saving tons of carbon compared to the global average! To improve further, look at sourcing organic, local produce (reducing transportation transport emissions) and minimizing food waste (which generates landfill methane).`;
        } else {
          replyText = `Hi! Your current diet profile is ${diet.replace('_', ' ')}. Moving toward plant-based meals (even just 2-3 times a week) has the single largest food-related impact. Farmed beef generates up to 27 kg CO₂e per kg, while legumes produce less than 1 kg!`;
        }
      } else if (query.includes('car') || query.includes('drive') || query.includes('commute') || query.includes('transport') || query.includes('flight')) {
        replyText = `Hello! Your primary transport mode is set to ${transportMode.replace('_', ' ')}. Transport is a massive carbon driver. If you commute via car, sharing rides or shifting to trains/buses (which emit up to 80% less per passenger-km) will dramatically lower your monthly ${monthlyTotal.toFixed(1)} kg footprint.`;
      } else if (query.includes('electricity') || query.includes('energy') || query.includes('heating') || query.includes('gas')) {
        replyText = `Hi! You are currently using ${energySource} energy. Home energy is highly grid-dependent. Your grid is currently running at **${gridIntensityGperKwh} gCO₂/kWh** (${gridStatus}${gridSource === 'live' ? ' — live National Grid data' : ''}). ${gridStatus === 'low' || gridStatus === 'very low' ? 'Great news — now is a good time to run high-energy appliances!' : gridStatus === 'high' || gridStatus === 'very high' ? 'The grid is carbon-intensive right now — try to defer high-energy tasks.' : 'The grid is at moderate intensity.'} Switching to solar arrays can reduce your footprint significantly.`;
      } else if (query.includes('hello') || query.includes('hi ') || query.includes('hey')) {
        replyText = `Hello ${user.name}! I am your AI Advisor. Looking at your profile, your annual carbon baseline is estimated at ${baseline.toFixed(0)} kg CO₂e, and your highest emission driver is ${highestCategory !== 'None' ? highestCategory : 'yet to be logged'}. Ask me how you can optimize your diet, energy, or transport!`;
      } else {
        replyText = `That's a very insightful question, ${user.name}. Looking at your current carbon profile (monthly footprint of ${monthlyTotal.toFixed(1)} kg CO₂e, highest driver: ${highestCategory !== 'None' ? highestCategory : 'not recorded yet'}), the best step you can take today is logging your daily habits and focusing on reducing emissions in your transport or home energy sectors. How else can I assist you with your carbon reduction roadmap?`;
      }
    }

    return NextResponse.json({ text: replyText }, { status: 200 });

  } catch (error) {
    console.error('[COACH API ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
