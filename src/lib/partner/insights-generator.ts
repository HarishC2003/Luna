interface InsightInput {
  phase: string
  dayOfCycle: number
  daysUntilPeriod: number
  avgMood: number | null
  avgEnergy: number | null
}

interface PartnerInsights {
  tips: string[]
  whatToExpect: string
  dosDonts: { dos: string[], donts: string[] }
}

export function generatePartnerInsights(input: InsightInput): PartnerInsights {
  const { phase, daysUntilPeriod, avgMood, avgEnergy } = input

  const insights: PartnerInsights = {
    tips: [],
    whatToExpect: '',
    dosDonts: { dos: [], donts: [] },
  }

  // Phase-specific insights
  if (phase === 'menstrual') {
    insights.whatToExpect = 'She may feel tired and need more rest. Physical discomfort is common.'
    insights.tips = [
      'Offer to handle chores or errands',
      'Stock her favorite comfort foods and snacks',
      'Suggest a cozy movie night at home instead of going out',
      'Be patient if she seems more emotional or irritable',
    ]
    insights.dosDonts = {
      dos: ["Ask how she's feeling", 'Offer a heating pad or pain relief', 'Be understanding if plans change'],
      donts: ['Schedule intense physical activities', 'Pressure her to be social', 'Minimize her discomfort'],
    }
  } else if (phase === 'follicular') {
    insights.whatToExpect = 'Energy and mood are rising. This is usually her best time of the month.'
    insights.tips = [
      'Great time to plan date nights or adventures',
      'She might be more open to trying new things',
      'Support any new projects or goals she wants to start',
    ]
    insights.dosDonts = {
      dos: ['Suggest active dates or outings', 'Encourage her ideas and energy', 'Plan something fun together'],
      donts: ['Assume she wants to stay home', 'Waste her high-energy days'],
    }
  } else if (phase === 'ovulatory') {
    insights.whatToExpect = "Peak energy, confidence, and social mood. She's at her most radiant."
    insights.tips = [
      "Compliment her — she'll feel it even more this week",
      'Plan social activities or date nights',
      'Great time for important conversations or decisions',
    ]
    insights.dosDonts = {
      dos: ['Tell her she looks great', 'Plan something special', 'Enjoy her high energy'],
      donts: ['Take her good mood for granted'],
    }
  } else if (phase === 'luteal') {
    insights.whatToExpect = 'Winding down. Mood swings, lower energy, or irritability are common and hormonal — not personal.'
    insights.tips = [
      'Be extra patient and understanding',
      'Offer comfort food and cozy activities',
      "Don't take mood shifts personally — it's her hormones, not you",
      'Give her space if she needs it, but check in gently',
    ]
    insights.dosDonts = {
      dos: ['Listen without trying to fix', 'Stock her favorite snacks', 'Suggest low-key activities', 'Validate her feelings'],
      donts: ['Start arguments or bring up heavy topics', 'Expect high energy', 'Dismiss her emotions as "PMS"'],
    }

    // Add specific tips if period is coming soon
    if (daysUntilPeriod <= 3 && daysUntilPeriod >= 0) {
      insights.tips.unshift(`Her period is predicted in ${daysUntilPeriod} day${daysUntilPeriod === 1 ? '' : 's'} — stock up on pads/tampons and pain relief.`)
    }
  } else {
    insights.whatToExpect = 'Cycle phase is currently unknown.'
    insights.tips = ["Be supportive and ask how she's doing."]
    insights.dosDonts = { dos: [], donts: [] }
  }

  // Adjust based on mood/energy trends
  if (avgMood !== null && avgMood < 2.5) {
    insights.tips.push('Her mood has been lower than usual this week — check in on her gently.')
  }
  if (avgEnergy !== null && avgEnergy < 2.5) {
    insights.tips.push('Her energy has been low — offer to take tasks off her plate.')
  }

  return insights
}
