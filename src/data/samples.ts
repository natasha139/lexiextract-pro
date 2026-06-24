export interface AcademicSample {
  title: string;
  source: string;
  category: string;
  target_level: string;
  text: string;
}

export const ACADEMIC_SAMPLES: AcademicSample[] = [
  {
    title: "The Epistemological Shift in Synthetic Biology",
    source: "Journal of Bio-Ethical Inquiry (2025)",
    category: "Scientific Philosophy",
    target_level: "GRE",
    text: "For decades, biology remained a predominantly descriptive discipline, meticulously cataloging the organic world. However, the advent of synthetic biology represents an profound epistemological shift, transitioning the field from passive observation to active construction. Critics argue that we should not take for granted the intricate self-regulating mechanisms of natural ecosystems, which have evolved over millennia. Indeed, to bear in mind the potential of run-away self-replication is to acknowledge the severe existential risks inherent in bio-foundry automation. It has been speculated that unregulated distribution of CRISPR gene-drive protocols might trigger irreversible alterations in native phenotypes. It is this capacity for structural disruption that provides an unprecedented advantage for research, while simultaneously demanding robust regulatory oversight."
  },
  {
    title: "An Inquiry into Urban Microclimates and Urban Canopy Effects",
    source: "Cambridge Environmental Review (IELTS Passage 3)",
    category: "Environmental Studies",
    target_level: "IELTS",
    text: "Urbanization has inadvertently altered local climates by creating distinct microclimates. The thermal mass of concrete and asphalt absorbs solar radiation during the day and slowly releases it at night, culminating in the notorious 'Urban Heat Island' effect. An advantage of dense urban planting lies in its ability to mitigate these temperature spikes through evapotranspiration. Not only does strategic reforestation improve local air quality, but it also lowers cooling costs across surrounding metropolitan sectors. Researchers have demonstrated that even narrow green corridors yield substantial cooling benefits. To facilitate these changes, municipalities must integrate climate-resilient flora into their developmental masterplans."
  },
  {
    title: "The Devonian Extinction Event and Oceanic Anoxia",
    source: "TOEFL Academic Listening & Reading Corpus",
    category: "Paleontology / Geology",
    target_level: "TOEFL",
    text: "During the Late Devonian period, Earth experienced a devastating mass extinction that wiped out approximately 70 percent of all marine species. While the exact trigger remains a subject of ongoing debate, recent sedimentary analysis underscores the role of widespread oceanic anoxia—a severe depletion of oxygen in ancient seas. Scientific consensus suggests that the rapid expansion of terrestrial land plants inadvertently catalyzed this catastrophe. As deeply rooted vascular plants colonized continents, their biological weathering processes released massive quantities of nutrients into global waterways. This nutrient influx triggered colossal algal blooms, the subsequent decomposition of which exhausted dissolved oxygen in marine habitats, plunging shallow reef systems into toxic hypoxia."
  },
  {
    title: "Mathematical Foundations of Statistical Learning and Information Entropy",
    source: "MIT Journal of Machine Learning & Statistics (2026)",
    category: "Data Science & Mathematics",
    target_level: "GRE",
    text: "In the study of statistical learning, we analyze how a model learns from a dataset $\\mathcal{D} = \\{(x_i, y_i)\\}_{i=1}^N$. The primary objective is to minimize the empirical risk, defined as $R(f) = \\frac{1}{N} \\sum_{i=1}^N L(y_i, f(x_i))$, where $L$ is a convex loss function. One of the most fundamental concepts in information theory is the Shannon Entropy, which measures the average information rate of a random variable: \\[ H(X) = -\\sum_{x \\in \\mathcal{X}} P(x) \\log_2 P(x) \\] In high-dimensional optimization, backpropagation relies heavily on the chain rule for computing gradients of parameters. We must bear in mind that a conspicuous advantage of using a gradient descent optimization algorithm, such as Adam with learning rate $\\eta$, is its ability to accelerate convergence when traversing non-convex loss surfaces. In modern neural networks, the weight update is governed by: $$ w_{t+1} = w_t - \\eta \\cdot \\nabla L(w_t) $$ By analyzing the spectral radius of the Hessian matrix $\\mathcal{H}$, we can guarantee that convergence remains stable over millions of update steps."
  },
  {
    title: "The Rise of On-Demand Content Platforms",
    source: "Cambridge FCE Language Practice",
    category: "Media Studies / Sociology",
    target_level: "FCE",
    text: "Broadcasters have noticed a huge change in how families consume media. Formerly, viewers gathered around the television set at specific hours to watch scheduled television programming together. This shared daily ritual has been phased out by the rapid rollout of streaming subscriptions. Currently, teenagers and adults show a strong preference for choosing their own material on demand. While parents initially worried that individual viewing would isolate family members, studies show that households still sit together on weekends, though they are more likely to watch a blockbuster movie or a popular drama series selected from a shared digital library."
  }
];
