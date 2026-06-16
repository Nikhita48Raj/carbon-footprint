import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/db';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import { buildCategorySummary, calculateCategoryBaseline } from '@/lib/calculator';

export async function POST(request) {
  try {
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

Answer the user concisely and directly. Suggest actionable, realistic modifications. Keep tone positive, scientific, and motivating.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      // Send to real Gemini API
      let promptText = '';
      if (action === 'generateWeeklyPlan') {
        promptText = `${systemPrompt}\n\nTask: Generate a personalized 7-day Weekly Action Plan focusing on their biggest driver: ${highestCategory || 'general'}. List 3 high-impact specific actions for this week. Include brief rationales.`;
      } else {
        promptText = `${systemPrompt}\n\nUser Question: ${message}\n\nResponse:`;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
        replyText = `Hi! You are currently using ${energySource} energy. Home energy is highly grid-dependent. Since your grid electricity factor is 0.233 kg CO₂e per kWh, adjusting your thermostat, improving insulation, or switching to solar arrays can reduce your footprint significantly.`;
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
