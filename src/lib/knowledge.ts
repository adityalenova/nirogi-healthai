/** Nirogi Knowledge Library — curated health literature + the institutions Nirogi cites. */

export type Institution = { name: string; country: string; knownFor: string; url: string };

export const INSTITUTIONS: Institution[] = [
  { name: "Harvard Medical School", country: "USA", knownFor: "Epidemiology, nutrition, cancer research", url: "https://hms.harvard.edu" },
  { name: "Johns Hopkins Medicine", country: "USA", knownFor: "Surgery, infectious disease, public health", url: "https://www.hopkinsmedicine.org" },
  { name: "Mayo Clinic", country: "USA", knownFor: "Clinical practice guidelines, rare diseases", url: "https://www.mayoclinic.org" },
  { name: "World Health Organization", country: "International", knownFor: "Global disease standards and guidelines", url: "https://www.who.int" },
  { name: "National Institutes of Health", country: "USA", knownFor: "Biomedical research, clinical trials", url: "https://www.nih.gov" },
  { name: "MIT Health Sciences", country: "USA", knownFor: "Bioengineering, computational medicine", url: "https://hst.mit.edu" },
  { name: "Stanford Medicine", country: "USA", knownFor: "Precision medicine, AI in healthcare", url: "https://med.stanford.edu" },
  { name: "Oxford University", country: "UK", knownFor: "Epidemiology, vaccine research", url: "https://www.medsci.ox.ac.uk" },
  { name: "Cambridge University", country: "UK", knownFor: "Genetics, neuroscience", url: "https://www.medschl.cam.ac.uk" },
  { name: "Imperial College London", country: "UK", knownFor: "Cardiology, diabetes research", url: "https://www.imperial.ac.uk/medicine" },
  { name: "The Lancet", country: "UK", knownFor: "Global health research publication", url: "https://www.thelancet.com" },
  { name: "New England Journal of Medicine", country: "USA", knownFor: "Clinical studies, drug trials", url: "https://www.nejm.org" },
  { name: "JAMA", country: "USA", knownFor: "Clinical practice, public health", url: "https://jamanetwork.com" },
  { name: "BMJ", country: "UK", knownFor: "Evidence-based medicine", url: "https://www.bmj.com" },
  { name: "AIIMS New Delhi", country: "India", knownFor: "Indian disease burden, tropical medicine", url: "https://www.aiims.edu" },
  { name: "ICMR", country: "India", knownFor: "Indian health data and standards", url: "https://www.icmr.gov.in" },
  { name: "PGI Chandigarh", country: "India", knownFor: "Cardiology and neurology research", url: "https://pgimer.edu.in" },
  { name: "CMC Vellore", country: "India", knownFor: "Infectious disease research", url: "https://www.cmch-vellore.edu" },
  { name: "NIMHANS Bengaluru", country: "India", knownFor: "Mental health, neurology", url: "https://nimhans.ac.in" },
  { name: "Tata Memorial Centre", country: "India", knownFor: "Cancer research India", url: "https://tmc.gov.in" },
  { name: "Cleveland Clinic", country: "USA", knownFor: "Heart disease, surgery", url: "https://my.clevelandclinic.org" },
  { name: "Massachusetts General Hospital", country: "USA", knownFor: "Neurology, cancer, cardiology", url: "https://www.massgeneral.org" },
  { name: "Memorial Sloan Kettering", country: "USA", knownFor: "Oncology, cancer treatment", url: "https://www.mskcc.org" },
  { name: "Brigham and Women's Hospital", country: "USA", knownFor: "Women's health, cardiology", url: "https://www.brighamandwomens.org" },
  { name: "Toronto General Hospital", country: "Canada", knownFor: "Transplantation, cardiac surgery", url: "https://www.uhn.ca" },
  { name: "Montreal Neurological Institute", country: "Canada", knownFor: "Brain disorders, neuroscience", url: "https://www.mcgill.ca/neuro" },
  { name: "Karolinska Institute", country: "Sweden", knownFor: "Immunology, epidemiology", url: "https://ki.se/en" },
  { name: "University of Tokyo Hospital", country: "Japan", knownFor: "Gastroenterology, oncology", url: "https://www.h.u-tokyo.ac.jp/english" },
  { name: "Seoul National University Hospital", country: "South Korea", knownFor: "Digital health, genetics", url: "https://www.snuh.org/global" },
  { name: "Chinese Academy of Medical Sciences", country: "China", knownFor: "Traditional and modern medicine", url: "https://www.cams.ac.cn" },
  { name: "Wellcome Trust", country: "UK", knownFor: "Global health funding and research", url: "https://wellcome.org" },
  { name: "University of Melbourne", country: "Australia", knownFor: "Infectious disease, public health", url: "https://mdhs.unimelb.edu.au" },
  { name: "University of Cape Town", country: "South Africa", knownFor: "HIV, tropical disease", url: "http://www.health.uct.ac.za" },
  { name: "Aga Khan University", country: "Pakistan / Kenya", knownFor: "South Asia and Africa health", url: "https://www.aku.edu" },
  { name: "PubMed Central", country: "USA", knownFor: "Comprehensive medical literature", url: "https://www.ncbi.nlm.nih.gov/pmc" },
  { name: "Cochrane Reviews", country: "International", knownFor: "Systematic reviews, evidence summaries", url: "https://www.cochranelibrary.com" },
  { name: "UpToDate", country: "USA", knownFor: "Clinical decision support", url: "https://www.uptodate.com" },
  { name: "MedlinePlus", country: "USA", knownFor: "Patient health information", url: "https://medlineplus.gov" },
  { name: "WebMD", country: "USA", knownFor: "Consumer health information", url: "https://www.webmd.com" },
  { name: "Medscape", country: "USA", knownFor: "Clinical news and education", url: "https://www.medscape.com" },
  { name: "American Heart Association", country: "USA", knownFor: "Heart disease guidelines", url: "https://www.heart.org" },
  { name: "American Diabetes Association", country: "USA", knownFor: "Diabetes management guidelines", url: "https://diabetes.org" },
  { name: "American Cancer Society", country: "USA", knownFor: "Cancer prevention and treatment", url: "https://www.cancer.org" },
  { name: "American Academy of Pediatrics", country: "USA", knownFor: "Child health guidelines", url: "https://www.aap.org" },
  { name: "European Society of Cardiology", country: "Europe", knownFor: "European cardiac guidelines", url: "https://www.escardio.org" },
  { name: "International Diabetes Federation", country: "International", knownFor: "Global diabetes data", url: "https://idf.org" },
  { name: "Global Burden of Disease (IHME)", country: "USA", knownFor: "Disease burden data worldwide", url: "https://www.healthdata.org" },
  { name: "UNICEF Health", country: "International", knownFor: "Child and maternal health", url: "https://www.unicef.org/health" },
  { name: "The Lancet India", country: "India", knownFor: "India-specific health research", url: "https://www.thelancet.com" },
  { name: "NCBI", country: "USA", knownFor: "Gene, disease and drug databases", url: "https://www.ncbi.nlm.nih.gov" },
];

export const KNOWLEDGE_CATEGORIES = [
  "All",
  "Heart Health",
  "Diabetes",
  "Cancer",
  "Mental Health",
  "Nutrition",
  "Sleep",
  "Exercise",
  "Medicines",
  "Gut Health",
  "Vision and Hearing",
  "India Health",
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export type Article = {
  id: number;
  title: string;
  institution: string;
  year: number;
  category: Exclude<KnowledgeCategory, "All">;
  tools: string[];
  summary: string;
  findings: string[];
  url: string;
};

const inst = (name: string) => INSTITUTIONS.find((i) => i.name === name)?.url ?? "https://pubmed.ncbi.nlm.nih.gov";

type Seed = [string, string, number, Exclude<KnowledgeCategory, "All">, string[], string, string[]];

const SEEDS: Seed[] = [
  ["Effect of physical activity on cardiovascular mortality", "Harvard Medical School", 2023, "Heart Health", ["HeartSense"], "Large cohort evidence that regular moderate activity lowers cardiovascular death risk. Benefits begin well below the 150-minute weekly target.", ["150 min/week of brisk walking cut cardiac mortality by roughly a quarter", "Even 60 min/week showed measurable benefit", "Sedentary time is an independent risk factor"]],
  ["Dietary patterns and Type 2 Diabetes risk in India", "ICMR", 2024, "Diabetes", ["SugarSense", "CalorieEye"], "India-specific analysis of refined-carbohydrate heavy diets and diabetes incidence. Replacing white rice with millets or whole grains reduced risk.", ["Refined grain intake strongly associated with fasting glucose rise", "Millet substitution improved HbA1c in follow-up", "Urban diets carried higher risk than rural"]],
  ["Early detection of lung cancer via low-dose CT screening", "Mayo Clinic", 2023, "Cancer", ["CancerSense", "ScanIQ"], "Low-dose CT screening in high-risk smokers detects lung cancer at earlier, treatable stages and reduces mortality.", ["20% reduction in lung-cancer mortality in screened groups", "Highest benefit in adults 55-75 with heavy smoking history", "False positives require structured follow-up protocols"]],
  ["Sleep duration and all-cause mortality meta-analysis", "Oxford University", 2022, "Sleep", ["Sleep Tracker"], "Pooled analysis showing a U-shaped relationship between sleep duration and mortality, with 7-8 hours as the optimum.", ["Under 6 hours raised mortality risk notably", "Over 9 hours also associated with higher risk", "Sleep regularity mattered as much as duration"]],
  ["WHO guidelines on physical activity and sedentary behaviour", "World Health Organization", 2020, "Exercise", ["Exercise Tracker"], "Global recommendations for weekly activity across age groups, including strength training and limiting sedentary time.", ["150-300 min moderate or 75-150 min vigorous activity weekly", "Muscle strengthening on 2+ days per week", "Any activity is better than none"]],
  ["Sodium reduction and blood pressure control", "American Heart Association", 2021, "Heart Health", ["HeartSense", "CalorieEye"], "Reducing dietary sodium produces meaningful blood pressure drops, especially in salt-sensitive and hypertensive adults.", ["1g/day sodium cut lowered systolic BP by 2-4 mmHg", "Packaged foods are the dominant hidden source", "Potassium-rich foods amplify the benefit"]],
  ["Paracetamol dosing and hepatotoxicity risk", "BMJ", 2022, "Medicines", ["MedGuard"], "Review of safe paracetamol dosing thresholds and the liver injury risk from chronic supratherapeutic use.", ["Max 3-4 g/day for healthy adults, lower with alcohol use", "Chronic daily use raises transaminases in a subset", "Combination cold remedies cause accidental overdose"]],
  ["Gut microbiome diversity and metabolic health", "Stanford Medicine", 2023, "Gut Health", ["Gut Health"], "Higher microbiome diversity correlates with better insulin sensitivity and lower inflammatory markers.", ["Fermented food intake increased diversity in 10 weeks", "Fibre intake predicted short-chain fatty acid production", "Antibiotic courses caused months-long shifts"]],
  ["Depression prevalence and treatment gap in India", "NIMHANS Bengaluru", 2022, "Mental Health", ["Mind & Mood"], "National survey data on depression prevalence and the large proportion of Indians who never receive treatment.", ["Treatment gap exceeds 80% in several states", "Stigma is the leading barrier to care", "Brief digital interventions improved help-seeking"]],
  ["Blue light exposure and digital eye strain", "Johns Hopkins Medicine", 2023, "Vision and Hearing", ["Eye Strain"], "Prolonged screen use reduces blink rate and causes accommodative fatigue; scheduled breaks are the most effective mitigation.", ["20-20-20 rule reduced reported symptoms", "Dry eye driven mainly by reduced blinking", "Blue-light filters showed modest, inconsistent benefit"]],
  ["Hypertension burden in urban India", "AIIMS New Delhi", 2023, "India Health", ["HeartSense"], "Urban Indian adults show rising hypertension prevalence with low awareness and control rates.", ["Roughly 1 in 3 urban adults hypertensive", "Under half were aware of their diagnosis", "Salt intake exceeded WHO limits in most households"]],
  ["Intermittent fasting and metabolic outcomes", "NEJM", 2021, "Nutrition", ["CalorieEye", "Diet Plan"], "Time-restricted eating produces modest weight loss largely explained by reduced calorie intake.", ["Weight loss comparable to standard calorie restriction", "Some improvement in fasting insulin", "Adherence declined after 12 weeks"]],
  ["Vitamin D deficiency and bone health in South Asians", "The Lancet India", 2022, "India Health", ["Bone Health"], "High deficiency rates in Indian adults despite abundant sunlight, driven by skin pigmentation and indoor lifestyles.", ["Deficiency in over 60% of urban samples", "Supplementation improved bone mineral density", "Sun exposure alone was often insufficient"]],
  ["Hearing loss from personal audio devices", "World Health Organization", 2022, "Vision and Hearing", ["Hearing Health"], "Unsafe listening levels among young people are a major preventable cause of hearing loss.", ["Over 1 billion young people at risk globally", "80 dB for 40 hours weekly is the safe ceiling", "Damage accumulates and is irreversible"]],
  ["Yoga and blood pressure reduction — systematic review", "Cochrane Reviews", 2021, "Exercise", ["Exercise Tracker", "Breathe"], "Meta-analysis of yoga interventions showing small but consistent reductions in blood pressure.", ["Average systolic reduction of 4-5 mmHg", "Breathing-focused practice drove most of the effect", "Best results with 3+ sessions weekly"]],
  ["Sleep apnoea screening in primary care", "Cleveland Clinic", 2023, "Sleep", ["Sleep Tracker"], "Simple questionnaires plus overnight oximetry identify most moderate-to-severe obstructive sleep apnoea cases.", ["STOP-BANG had high sensitivity", "Untreated apnoea raised cardiovascular risk", "CPAP improved daytime function significantly"]],
  ["Antibiotic resistance patterns in Indian hospitals", "ICMR", 2023, "India Health", ["MedGuard"], "Surveillance data showing rising resistance in common pathogens and the role of over-the-counter antibiotic use.", ["Resistance to first-line agents rose year on year", "Self-medication is a major driver", "Stewardship programmes reduced inappropriate use"]],
  ["Processed food consumption and cancer risk", "The Lancet", 2023, "Cancer", ["CancerSense", "CalorieEye"], "Cohort study linking ultra-processed food intake to increased overall cancer incidence.", ["10% higher UPF intake linked to higher cancer risk", "Effect partly independent of obesity", "Additives and packaging chemicals implicated"]],
  ["Mindfulness-based stress reduction outcomes", "Massachusetts General Hospital", 2022, "Mental Health", ["Mind & Mood", "Stress"], "Eight-week mindfulness programmes reduce anxiety and perceived stress with durable effects at six months.", ["Effect sizes comparable to some medications for mild anxiety", "Daily practice length mattered less than consistency", "Benefits persisted at follow-up"]],
  ["Hydration status and cognitive performance", "NIH", 2021, "Nutrition", ["Water Tracker"], "Mild dehydration measurably reduces attention, short-term memory and mood.", ["2% body-water loss impaired concentration", "Thirst is a late signal of dehydration", "Regular small intakes outperform large boluses"]],
  ["Anaemia in Indian women — national survey analysis", "ICMR", 2022, "India Health", ["Daily Energy"], "Persistent high anaemia prevalence among Indian women of reproductive age with dietary iron as a key gap.", ["Over half of women in several states anaemic", "Iron plus vitamin C improved absorption", "Fatigue is the most reported symptom"]],
  ["Statins for primary prevention — benefit and harm", "JAMA", 2022, "Heart Health", ["HeartSense", "MedGuard"], "Weighing cardiovascular risk reduction against side effects in adults without established heart disease.", ["Clear benefit above 10-year risk thresholds", "Muscle symptoms mostly non-specific in trials", "Shared decision-making recommended"]],
  ["Screen time and adolescent mental health", "Cambridge University", 2023, "Mental Health", ["Mind & Mood", "Eye Strain"], "Dose-response relationship between heavy social media use and adolescent depressive symptoms.", ["Risk rose sharply above 3 hours daily", "Night-time use most strongly associated", "Content type mattered more than total minutes"]],
  ["Fibre intake and colorectal cancer prevention", "Harvard Medical School", 2021, "Gut Health", ["Gut Health", "CancerSense"], "Higher dietary fibre intake is associated with meaningfully lower colorectal cancer incidence.", ["Each 10 g/day of fibre lowered risk about 10%", "Whole grains showed the strongest effect", "Fibre supplements were less protective than foods"]],
  ["Air pollution and respiratory disease in Indian cities", "AIIMS New Delhi", 2024, "India Health", ["Oxygen", "HeartSense"], "PM2.5 exposure in major Indian cities is linked to reduced lung function and increased hospital admissions.", ["Winter peaks correlated with admission spikes", "Children and elderly most affected", "Indoor filtration reduced symptom days"]],
  ["Diabetes remission through weight loss", "Imperial College London", 2022, "Diabetes", ["SugarSense", "Weight"], "Structured weight-loss programmes achieved type 2 diabetes remission in a substantial minority of participants.", ["10-15 kg loss produced highest remission rates", "Earlier diagnosis predicted better outcomes", "Weight regain reversed remission"]],
  ["Thyroid disorders — screening and management", "Mayo Clinic", 2023, "Medicines", ["MedGuard"], "Guidance on when to screen for thyroid dysfunction and how to interpret borderline TSH results.", ["Subclinical hypothyroidism often needs monitoring not treatment", "Symptoms are non-specific", "Pregnancy requires tighter targets"]],
  ["Heat stress and kidney injury in outdoor workers", "Karolinska Institute", 2023, "India Health", ["Temperature", "Water Tracker"], "Repeated occupational heat exposure without hydration is linked to chronic kidney disease of unknown origin.", ["Hydration breaks reduced injury markers", "Risk highest in agricultural workers", "Shade and scheduling were protective"]],
  ["Prostate cancer screening — benefits and overdiagnosis", "Memorial Sloan Kettering", 2022, "Cancer", ["CancerSense"], "PSA screening reduces prostate cancer mortality modestly but leads to significant overdiagnosis.", ["Shared decision-making recommended after 50", "Active surveillance avoids overtreatment", "Family history raises baseline risk"]],
  ["Probiotics for irritable bowel syndrome", "Cochrane Reviews", 2022, "Gut Health", ["Gut Health"], "Certain probiotic strains improve IBS symptoms, though effects vary widely between products.", ["Multi-strain products performed best", "Benefit typically appears within 4 weeks", "Evidence quality remains moderate"]],
  ["Cardiac rehabilitation after heart attack", "European Society of Cardiology", 2021, "Heart Health", ["Exercise Tracker", "HeartSense"], "Structured cardiac rehab lowers re-admission and mortality after myocardial infarction.", ["Up to 25% reduction in cardiac mortality", "Uptake remains low worldwide", "Home-based programmes matched centre-based results"]],
  ["Micronutrient deficiencies in vegetarian diets", "Cleveland Clinic", 2022, "Nutrition", ["Diet Plan", "CalorieEye"], "Practical guidance on B12, iron, zinc and omega-3 for predominantly plant-based Indian diets.", ["B12 supplementation is essential for strict vegetarians", "Iron absorption improves with vitamin C", "Combining pulses and grains covers amino acids"]],
  ["Physical activity and depression prevention", "JAMA", 2022, "Mental Health", ["Exercise Tracker", "Mind & Mood"], "Even modest activity levels lower the risk of developing depression across age groups.", ["Equivalent of 2.5 hours brisk walking weekly cut risk", "Benefit independent of baseline fitness", "Group activity showed added social benefit"]],
  ["Continuous glucose monitoring in type 2 diabetes", "American Diabetes Association", 2023, "Diabetes", ["SugarSense", "Glucose"], "CGM improves time-in-range and HbA1c even in non-insulin-treated type 2 diabetes.", ["Behaviour change after seeing post-meal spikes", "Reduced hypoglycaemia in insulin users", "Cost remains the main barrier"]],
  ["Bone density loss after menopause", "Brigham and Women's Hospital", 2021, "Nutrition", ["Bone Health"], "Rapid bone loss in early post-menopause and the role of weight-bearing exercise, calcium and vitamin D.", ["Fastest loss in the first 5 years", "Resistance training slowed loss", "Screening recommended at 65 or earlier with risk factors"]],
  ["Tobacco use and oral cancer risk in India", "Tata Memorial Centre", 2023, "Cancer", ["CancerSense"], "Smokeless tobacco is the dominant driver of India's high oral cancer burden.", ["Gutkha and khaini strongly associated", "Early lesions are visually detectable", "Cessation rapidly reduces risk"]],
  ["Sleep, circadian rhythm and shift work", "The Lancet", 2022, "Sleep", ["Sleep Tracker", "Energy"], "Chronic shift work disrupts circadian alignment and raises metabolic and cardiovascular risk.", ["Night shifts linked to higher diabetes risk", "Fixed rotation better than random schedules", "Light exposure timing helps realignment"]],
  ["Drug interactions in polypharmacy for elderly patients", "UpToDate", 2023, "Medicines", ["MedGuard", "Prescription Reader"], "Older adults on five or more medicines face substantially higher interaction and fall risk.", ["Regular deprescribing reviews reduce harm", "Anticholinergic burden predicts cognitive decline", "Pharmacist review lowered admissions"]],
  ["Global burden of chronic kidney disease", "Global Burden of Disease (IHME)", 2023, "India Health", ["MedGuard"], "CKD is a rapidly growing cause of death worldwide, with diabetes and hypertension as leading causes.", ["Deaths rose steeply over two decades", "Most cases detected late", "Simple creatinine screening is cost-effective"]],
  ["Heart rate variability as a stress marker", "MIT Health Sciences", 2023, "Heart Health", ["Stress", "Heart Rhythm"], "HRV is a practical non-invasive indicator of autonomic balance and recovery status.", ["Lower HRV linked to higher perceived stress", "Slow breathing raised HRV acutely", "Individual baselines vary widely"]],
];

export const ARTICLES: Article[] = SEEDS.map(([title, institution, year, category, tools, summary, findings], i) => ({
  id: i + 1,
  title,
  institution,
  year,
  category,
  tools,
  summary,
  findings,
  url: inst(institution),
}));

export const SUGGESTED_QUESTIONS = [
  "What are the early signs of diabetes?",
  "How much water should I drink daily?",
  "What foods reduce blood pressure?",
  "Is paracetamol safe to take daily?",
  "What does high creatinine mean?",
];
