import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { EMISSION_FACTORS } from '@/lib/emissionFactors';
import { rateLimit } from '@/lib/rateLimiter';

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!rateLimit(ip, 5, 60000)) { // 5 scans per minute limit
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a demo simulation response if no API Key is set so the demo doesn't crash
      console.warn('[API Key missing] Simulating Vision scan result.');
      return NextResponse.json({
        success: true,
        mocked: true,
        detectedItems: [
          { name: 'Beef steak', weightKg: 0.25, co2e: 6.75, category: 'food', subType: 'beef' },
          { name: 'Potatoes', weightKg: 0.2, co2e: 0.4, category: 'food', subType: 'vegetables' }
        ],
        totalCO2e: 7.15,
        summaryText: "Simulated Beef Steak & Potatoes. (To activate real scanning, configure GEMINI_API_KEY)"
      });
    }

    // Split base64 prefix
    const matches = image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid base64 image format' }, { status: 400 });
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    const promptText = `Analyze this food plate photo. Identify the main food components, estimate their weight in kilograms, map them to the closest food keys from these emission categories:
    Beef (beef), Lamb (lamb), Pork (pork), Poultry (poultry), Farmed Fish (fish_farmed), Wild Fish (fish_wild), Dairy Milk (dairy_milk), Dairy Cheese (dairy_cheese), Eggs (eggs), Vegetables (vegetables), Fruit (fruit), Legumes (legumes), Cereals (cereals).
    
    Return ONLY a valid JSON array of items like this structure:
    [
      { "name": "Steak", "weightKg": 0.25, "subType": "beef" },
      { "name": "Mashed Potatoes", "weightKg": 0.15, "subType": "vegetables" }
    ]
    Do not add markdown formatting, backticks, or other text outside the JSON.`;

    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ]
        })
      }
    );

    if (!apiResponse.ok) {
      throw new Error(`Gemini API failed: ${apiResponse.statusText}`);
    }

    const responseData = await apiResponse.json();
    let responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    // Clean JSON if the LLM added markdown backticks
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedItems = JSON.parse(responseText);

    const detectedItems = parsedItems.map(item => {
      const subType = item.subType || 'vegetables';
      const weightKg = item.weightKg || 0.1;
      const factor = EMISSION_FACTORS.food[subType] ?? EMISSION_FACTORS.food.vegetables;
      const co2e = Math.round(factor * weightKg * 10000) / 10000;
      return {
        name: item.name,
        weightKg,
        co2e,
        category: 'food',
        subType
      };
    });

    const totalCO2e = detectedItems.reduce((acc, curr) => acc + curr.co2e, 0);

    return NextResponse.json({
      success: true,
      detectedItems,
      totalCO2e: Math.round(totalCO2e * 10000) / 10000,
      summaryText: `Successfully parsed ${detectedItems.length} items from your plate.`
    });

  } catch (error) {
    console.error('[PLATE SCAN ERROR]', error);
    return NextResponse.json({ error: 'Internal server error during image analysis' }, { status: 500 });
  }
}
