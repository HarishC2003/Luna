export const getCycleDayInsight = (day: number): string => {
  if (day >= 1 && day <= 3) {
    return "Your progesterone and estrogen just dropped sharply. This is why you might feel tired or crampy. Your body is shedding the uterine lining — about 2-3 tablespoons of blood over the next few days. Rest is essential right now.";
  }
  if (day >= 4 && day <= 6) {
    return "Your period is likely winding down. Estrogen is beginning its slow rise again, which means your energy and mood will start to improve. Iron levels might be slightly low, so eat dark leafy greens or red meat.";
  }
  if (day >= 7 && day <= 9) {
    return "You are in the follicular phase! Estrogen and testosterone are rising. You'll likely notice feeling more energetic, focused, and mentally sharp. This is a great time to tackle complex tasks or start a new project.";
  }
  if (day >= 10 && day <= 13) {
    return "Estrogen is approaching its peak. You might feel more social, confident, and your skin might even look glowing. Your body is preparing for ovulation, so you may notice changes in cervical fluid (it becomes clearer and stretchier).";
  }
  if (day >= 14 && day <= 15) {
    return "You're ovulating! An egg was just released. If you're trying to conceive, the next 24 hours are your most fertile window. If you're avoiding pregnancy, be extra careful. You're at peak energy, and your communication skills are sharpest.";
  }
  if (day >= 16 && day <= 19) {
    return "You've entered the luteal phase. The empty follicle that released the egg is now producing progesterone. You might feel a sudden shift inward — becoming more introspective, calm, or slightly lower energy. This is totally normal.";
  }
  if (day >= 20 && day <= 24) {
    return "Progesterone is peaking, which can slow down digestion (hello, bloating) and make you feel sleepy. If no pregnancy occurred, estrogen is also dropping. It's common to feel increased hunger or cravings as your body burns slightly more calories.";
  }
  if (day >= 25 && day <= 28) {
    return "Both estrogen and progesterone are dropping steeply as your body prepares for a new cycle. This hormonal plunge triggers PMS symptoms — it's hormonal, not you being 'dramatic.' Be kind to yourself, avoid excessive caffeine, and prepare your comfort items.";
  }
  if (day > 28) {
    return "You've passed the average 28-day mark. If your cycle is naturally longer, you're likely still in the late luteal phase experiencing a continued hormone drop. If this is unusually late for you, stress or other factors might be delaying your period.";
  }
  return "Track your cycle to get personalized daily insights about your biology.";
};
