const events = [
  {
    slug: 'waic-ai-for-good-summit',
    prompt:
      'A grand futuristic AI summit main stage in Shanghai, massive curved LED screen showing "AI for Good", packed audience in a modern conference hall, blue and green ambient lighting, cinematic wide angle, photorealistic, high detail',
  },
  {
    slug: 'waic-smart-manufacturing-robotics',
    prompt:
      'Advanced robotics factory floor in Shanghai Zhangjiang, industrial robotic arms assembling components, engineers observing, bright clean modern facility, AI smart manufacturing theme, photorealistic',
  },
  {
    slug: 'waic-ai-medical-imaging-summit',
    prompt:
      'Modern medical imaging lab with doctors reviewing AI diagnostics on large monitors, MRI and CT scans, Shanghai skyscraper view through windows, clean white and blue tones, photorealistic',
  },
  {
    slug: 'waic-llm-startup-investor-pitch',
    prompt:
      'Elegant evening startup pitch event in a Shanghai art museum, founders presenting to investors around a long table, warm lighting, wine glasses, large language model visuals on screen, photorealistic',
  },
  {
    slug: 'waic-ai-education-classroom',
    prompt:
      'Future AI classroom at a Shanghai university, students using tablets with AI tutors, interactive holographic blackboard, bright friendly learning atmosphere, photorealistic',
  },
  {
    slug: 'waic-autonomous-driving-roadshow',
    prompt:
      'Autonomous vehicle test track in Shanghai Jiading, self-driving cars with sensors, smart city infrastructure, sunny day, tech showcase atmosphere, photorealistic',
  },
  {
    slug: 'waic-ai-art-design-workshop',
    prompt:
      'Creative AI art workshop in Shanghai M50 art district, artists and designers using generative AI tools on large screens, colorful digital paintings, industrial loft space, photorealistic',
  },
  {
    slug: 'waic-sustainable-ai-energy',
    prompt:
      'Sustainable AI and green energy conference on Chongming Eco Island near Shanghai, modern eco-building surrounded by nature, wind turbines and solar panels, fresh green and blue theme, photorealistic',
  },
]

async function generateImage(prompt) {
  const res = await fetch('https://apihub.agnes-ai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AGNES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'agnes-image-2.1-flash',
      prompt,
      size: '1024x768',
      extra_body: { response_format: 'url' },
    }),
  })
  if (!res.ok) throw new Error(`Agnes error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.data[0].url
}

async function main() {
  const results = []
  for (const ev of events) {
    try {
      const url = await generateImage(ev.prompt)
      results.push({ slug: ev.slug, url })
      console.log(`${ev.slug}\t${url}`)
    } catch (err) {
      console.error(`FAILED ${ev.slug}: ${err.message}`)
      results.push({ slug: ev.slug, error: err.message })
    }
  }
  const fs = await import('fs')
  fs.writeFileSync('/tmp/event-image-urls.json', JSON.stringify(results, null, 2))
}

main()
