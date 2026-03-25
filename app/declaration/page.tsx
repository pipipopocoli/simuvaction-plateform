import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Position Paper — GCTAI | SimuVaction 2026",
  description: "Full Position Paper by the Global Consortium for Trusted Artificial Intelligence on AI in Education.",
};

export default function DeclarationPage() {
  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/simuvaction-logo.png" alt="SimuVaction" width={140} height={35} className="h-9 w-auto" priority />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="hidden text-sm font-medium text-gray-500 transition hover:text-[#511E84] md:block">
              Home
            </Link>
            <Link href="/login" className="rounded-full bg-[#511E84] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#3d1663]">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#511E84]">
            Position Paper
          </div>
          <h1 className="font-serif text-3xl font-bold leading-tight text-[#1a1a2e] md:text-5xl">
            Advancing Human-Centred AI for Inclusive Education
          </h1>
          <p className="mt-4 text-base text-gray-500">
            On behalf of the Global Consortium for Trusted Artificial Intelligence (GCTAI) and its members
          </p>
          <p className="mt-2 text-sm text-gray-400">
            SimuVaction on AI &mdash; Versailles, March 25, 2026
          </p>
        </div>
      </header>

      {/* Document body */}
      <article className="mx-auto max-w-3xl px-6 py-12">
        <div className="prose prose-lg prose-slate max-w-none">

          {/* I. Introduction */}
          <h2 className="mt-0 border-b border-gray-200 pb-3 font-serif text-2xl font-bold text-[#1a1a2e]">
            I. Introduction: Advancing Human-Centred AI for Inclusive Education
          </h2>
          <p>
            The Global Consortium for Trusted Artificial Intelligence (GCTAI) submits this paper to contribute to Simuvaction 2026&rsquo;s global discussions on the use of Artificial Intelligence (AI) in education.
          </p>
          <p>
            GCTAI is a multistakeholder initiative that connects research, policy, and practice. It promotes the development and use of AI based on human rights, inclusion, access, and democratic values.
          </p>
          <p>
            Education systems worldwide are undergoing major changes due to the rapid spread of AI, especially generative AI (GenAI). These technologies can support personalized learning, reduce administrative work, and expand access to quality educational materials. However, they also create risks, including bias, privacy violations, misinformation, and reduced trust in education systems.
          </p>
          <p>
            GCTAI&rsquo;s position builds on its ongoing work, particularly in Responsible AI and AI and the Future of Work, and aligns with guidance from UNESCO, the OECD, and the European Commission. We reaffirm that AI in education must support Sustainable Development Goal 4: inclusive and equitable quality education for all.
          </p>

          {/* 1. Personalized Student Assessment */}
          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">1. On Personalized Student Assessment</h3>
          <p>
            AI-based adaptive learning platforms can help tailor content, pace, and assessment to each student. They can also help educators identify learning gaps early and provide targeted support.
          </p>
          <p>
            However, GCTAI is concerned about risks such as algorithmic bias, lack of transparency in grading, and excessive reliance on data. These systems may reinforce dominant cultural perspectives and limit diversity.
          </p>
          <p>
            GCTAI recommends that these systems undergo independent bias audits and be used as support tools, not decision-makers. Teachers must remain responsible for final evaluations. Providers should also publish clear information about how their models work and are trained.
          </p>
          <p>
            Each country must develop digital literacy program and ethical framework to ensure teacher are knowledgeable on the responsible usage of AI in the classroom and for assessment.
          </p>

          {/* 2. Student Monitoring */}
          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">2. AI in Student Monitoring and Proctoring</h3>
          <p>
            The use of remote proctoring and biometric monitoring increased significantly during the COVID-19 pandemic. While intended to protect academic integrity, these tools raise serious concerns about privacy and discrimination.
          </p>
          <p>
            Technologies such as facial recognition and keystroke tracking collect large amounts of personal data, often without proper consent. They may also misidentify certain groups, especially women and individuals with darker skin tones. In addition, surveillance can harm trust in learning environments.
          </p>
          <p>
            GCTAI supports a prohibition on live biometric recognition in education. Safer alternatives, such as randomized exams and honor codes, should be preferred. Any monitoring system must follow strict data protection principles and be supervised by relevant authorities.
          </p>

          {/* 3. Admissions */}
          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">3. AI in Admissions and Resource Allocation</h3>
          <p>
            Predictive analytics can help institutions manage admissions and allocate resources. However, if based on historical data, these systems may reproduce existing inequalities.
          </p>
          <p>
            GCTAI recommends that all such systems undergo a continuous Human Rights and Equity Impact Assessment (HRIA). Decisions on admissions, scholarships, or discipline must always include human review and that human evaluation must remain final authority. Institutions should also clearly disclose how these systems work and what data they use.
          </p>

          {/* 4. AI Tutoring */}
          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">4. AI-Powered Tutoring and Generative AI Tools</h3>
          <p>
            Generative AI tools, such as tutoring systems and writing assistants, can provide personalized support and improve access to education. They are especially useful where there is a shortage of teachers.
          </p>
          <p>However, they also present challenges:</p>
          <ul>
            <li>Risk to academic integrity;</li>
            <li>Possibility of inaccurate or misleading information;</li>
            <li>Reduced development of critical thinking skills.</li>
          </ul>
          <p>
            GCTAI recommends that the use of generative AI in education be guided by clear rules, adapted to age, and supervised by teachers. Students and teachers should be trained in AI literacy, including understanding its limits and ethical issues. Schools should require transparency when AI is used in academic work. Providers should also improve accuracy and prevent harmful outputs.
          </p>
          <p>
            GCTAI also supports rules requiring parental consent and age limits for minors using GenAI systems.
          </p>

          {/* 5. Disabilities */}
          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">5. AI for Students with Disabilities</h3>
          <p>
            AI tools such as speech-to-text and predictive typing can improve accessibility and inclusion. They can help ensure equal learning opportunities.
          </p>
          <p>
            However, these tools must be developed together with persons with disabilities. They may also involve sensitive personal data.
          </p>
          <p>
            GCTAI recommends that accessibility tools follow privacy-by-design and universal design principles. Governments should support open and inclusive datasets and ensure that these technologies respect users&rsquo; dignity, autonomy, and independence.
          </p>
          <p className="underline">
            Ensure the AI tools are available to students in all regions including rural and underserved area.
          </p>

          {/* 6. Teacher Support */}
          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">6. AI in Teacher Support and Professional Development</h3>
          <p>
            AI can reduce teachers&rsquo; administrative workload and support professional development.
          </p>
          <p>
            However, it should not reduce teachers to supervisors of automated systems. Excessive monitoring of teachers can harm their autonomy and trust. The level of human oversight should be proportional with the context and the task, for the low risk administrative function, AI systems may operate under a &ldquo;Human-on-the-Loop&rdquo; model that allow teachers to supervise. However, teachers must have authority on the high risk decision such as grading, feedback and student development.
          </p>
          <p>
            GCTAI recommends that these tools be implemented through consultation processes. Teacher training should include AI skills, and AI should support&mdash;not replace&mdash;teachers&rsquo; professional judgment.
          </p>

          {/* II. Regulation */}
          <h2 className="mt-16 border-b border-gray-200 pb-3 font-serif text-2xl font-bold text-[#1a1a2e]">
            II. Effective Regulation, Oversight, and Accountability
          </h2>

          <h3 className="mt-8 text-lg font-bold text-[#1a1a2e]">1. Rights to Privacy and Data Protection</h3>
          <p>
            Educational data are highly sensitive, revealing student&rsquo;s identities, behavioural patterns, and cognitive profiles. GCTAI therefore emphasizes legally enforceable frameworks that guarantee:
          </p>
          <ul>
            <li>Data minimization: Collect only information strictly necessary for learning purposes.</li>
            <li>Purpose limitation: Prohibit secondary uses (e.g., marketing or surveillance).</li>
            <li>Informed consent and transparency: Ensure understandable explanations, particularly for young learners.</li>
          </ul>
          <p>
            International standards such as the OECD&rsquo;s AI Principles (2019) and regional legislation like the EU&rsquo;s proposed AI Act provide guidance but require localization to educational contexts.
          </p>
          <p>
            GCTAI recommends that each jurisdiction should mandate education-specific data-protection codes of practice, and institutions should maintain a public AI system registry listing data categories and model purposes.
          </p>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">2. Equity and Non-Discrimination</h3>
          <p>Without proper safeguards, AI may increase inequalities.</p>
          <p>
            GCTAI recommends regular independent audits for bias and fairness. Governments should promote diverse datasets and require transparency in procurement processes. AI education initiatives should also target underrepresented groups. Each member state should ensure that AI models deployed in its national education system are trained on nationally representative datasets, including regional and indigenous languages, to prevent cultural and linguistic bias. This entails that each country&mdash;whether Brazil, France, Senegal, India, Mexico, or any other&mdash;should develop or adapt its own educational AI model reflecting the diversity of its population, rather than relying on foreign models trained on non-representative data.
          </p>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">3. Transparency, Explainability, and Effective Remedies</h3>
          <p>Users must be able to understand and challenge AI decisions.</p>
          <p>In our view, every AI tool influencing educational outcomes must include:</p>
          <ol>
            <li>Explanation interfaces accessible to non-technical users;</li>
            <li>Appeal procedures allowing reconsideration by qualified human authorities;</li>
            <li>Documentation standards detailing model provenance, training data, and update frequency;</li>
            <li>Disclosure requirements should be limited to non-sensitive information, ensuring that no data released enables the identification of individuals.</li>
          </ol>
          <p>
            Public institutions should maintain algorithmic transparency portals enabling outcome-based post-hoc auditing for non-technical users though not necessarily disclose model internals, similar to GCTAI&rsquo;s <em>Responsible AI Observatory</em> pilots, allowing civil-society monitoring.
          </p>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">4. International Collaboration Group for AI in Education (ICG-AI)</h3>
          <p>
            The establishment of ICG-AI should serve as a multilateral mechanism with binding commitments on resource mobilization and financial contributions, while fully preserving each member state&rsquo;s sovereign authority over the governance and deployment of AI within its own jurisdiction. Its mandate is to operationalize equitable access to AI in education through concrete, enforceable cooperation&mdash;not to prescribe how nations organize their domestic AI frameworks. Its scope should include:
          </p>
          <p>
            <strong>Knowledge transfer and capacity-building:</strong> Facilitate the dissemination of technical knowledge and competences across member states, with dedicated programming for countries at earlier stages of AI integration and structured peer-exchange mechanisms drawing on the experience of technologically advanced members.
          </p>
          <p>
            <strong>Financing of infrastructure and model deployment:</strong> Administer a differentiated Global Fund for AI in Education, providing financial resources and technical assistance to low- and middle-income countries for the development of data infrastructure, regional data centers, and the interoperable technical ecosystems required to deploy and sustain national AI models. Contributions are binding and scaled to each member&rsquo;s economic capacity; deployment decisions remain the sovereign prerogative of the receiving state, complemented as needed by multilateral development institutions.
          </p>
          <p>
            <strong>Support for nationally-governed model deployment:</strong> Provide voluntary extension services to support countries in building and maintaining their own national AI layers&mdash;feeding shared open-source educational models with context-specific data, locally produced knowledge, and culturally relevant inputs. Each nation retains full authority over data curation, model governance, and deployment decisions within its jurisdiction; ICG-AI&rsquo;s role is technical facilitation, not regulatory oversight. Principle of dynamic cooperation: a bi-annual state meetings to adapt to the rapid pace of technological evolution.
          </p>

          {/* III. Recommendations */}
          <h2 className="mt-16 border-b border-gray-200 pb-3 font-serif text-2xl font-bold text-[#1a1a2e]">
            III. Recommendations for Action
          </h2>

          <h3 className="mt-8 text-lg font-bold text-[#1a1a2e]">1. Prohibitions</h3>
          <p>GCTAI supports:</p>
          <ul>
            <li>A ban on social scoring in education;</li>
            <li>A prohibition on real-time facial recognition and emotional surveillance;</li>
            <li>A ban on the commercial use of student data.</li>
          </ul>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">2. Mandatory Human Rights and Equity Impact Assessments</h3>
          <p>All AI systems in education must include:</p>
          <ol>
            <li>Public HRIA reports and a risk evaluation system;</li>
            <li>Continuous Monitoring and Post-deployment evaluation;</li>
            <li>Community consultation;</li>
            <li>Education AI tools must never be for profit.</li>
          </ol>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">3. Adaptive Human Oversight: Human-in-the-Loop and Human-on-the-Loop</h3>
          <p>
            &ldquo;Human-on-the-Loop&rdquo; for low-risk administrative tasks that teachers can supervise and &ldquo;Human-in-the-Loop&rdquo; for high-stakes decisions (e.g., disciplinary actions, final grading).
          </p>
          <p>Institutions should clearly define:</p>
          <ul>
            <li>The authority of educators;</li>
            <li>The advisory role of AI;</li>
            <li>Documentation and accountability mechanisms for decisions made;</li>
            <li>Model disclosure and process of decision making;</li>
            <li>Possibility of appeal for &ldquo;Human-in-the-loop&rdquo; decisions.</li>
          </ul>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">4. International Cooperation and Capacity-Building</h3>
          <p>GCTAI supports:</p>
          <ul>
            <li>International cooperation and multi-stakeholder collaboration, including promoting interoperable and voluntary frameworks for ethical AI to foster accessible, inclusive and innovative AI systems.</li>
            <li>Training programs for policymakers and teachers;</li>
            <li>Public investment in open and inclusive AI systems;</li>
            <li>Research and Developmental Assistance.</li>
          </ul>

          {/* IV. Cross-Cutting */}
          <h2 className="mt-16 border-b border-gray-200 pb-3 font-serif text-2xl font-bold text-[#1a1a2e]">
            IV. Cross-Cutting Considerations
          </h2>

          <h3 className="mt-8 text-lg font-bold text-[#1a1a2e]">AI Literacy and Public Awareness</h3>
          <p>AI education should be included in school curricula and teacher training.</p>

          <h3 className="mt-8 text-lg font-bold text-[#1a1a2e]">Research and Evidence Gaps</h3>
          <p>More long-term research is needed, with strong ethical oversight.</p>

          <h3 className="mt-8 text-lg font-bold text-[#1a1a2e]">Green and Sustainable AI</h3>
          <p>AI policies should include environmental sustainability standards.</p>

          {/* V. Global Ethical Compact */}
          <h2 className="mt-16 border-b border-gray-200 pb-3 font-serif text-2xl font-bold text-[#1a1a2e]">
            V. Towards a Global Ethical Compact for AI in Education
          </h2>
          <p>The GCTAI proposes the following principles:</p>
          <ol>
            <li>Human-centred approach;</li>
            <li>Equity and non-discrimination;</li>
            <li>Transparency and accountability;</li>
            <li>Responsible data use;</li>
            <li>Global cooperation.</li>
          </ol>

          {/* VI. Conclusion */}
          <h2 className="mt-16 border-b border-gray-200 pb-3 font-serif text-2xl font-bold text-[#1a1a2e]">
            VI. Conclusion
          </h2>
          <p>
            AI has great potential in education, but only if used responsibly. Without regulation, it may increase inequality. With proper governance, it can improve access and learning outcomes.
          </p>
          <p>
            GCTAI remains committed to working with international and national partners to promote trustworthy AI in education. Simuvaction 2026 is an important opportunity to advance this goal.
          </p>

          {/* Disclosure */}
          <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h4 className="text-sm font-bold text-gray-700">Disclosure Statement on AI Use</h4>
            <p className="mt-2 text-sm italic text-gray-500">
              This position paper was researched with the assistance of a large-language-model legal research tool to ensure clarity and adherence to recent international sources. All factual statements and cited materials were verified against authoritative publications from UNESCO, OECD, the European Commission, and the Global Solutions Initiative. The final content reflects the collective policy orientation of GCTAI and does not constitute legal advice.
            </p>
          </div>

          {/* Amendments */}
          <h2 className="mt-16 border-b border-gray-200 pb-3 font-serif text-2xl font-bold text-[#1a1a2e]">
            Preliminary Agreement: Operationalization of ICG-AI
          </h2>
          <p>
            The following points are preliminary agreements that set the ground for a full operationalization of the organization. These represent the intent of the signing countries to design and implement the foundational principles of ICG-AI.
          </p>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">Amendment 5.A &mdash; Fund Capitalization and Contribution Schedule</h3>
          <p>
            All AI educational tools developed or procured through ICG-AI-funded programs must be deployed free of charge to end users&mdash;including students, teachers, and educational institutions&mdash;in recipient countries. Any pricing arrangement that conditions access on individual or institutional payment is incompatible with ICG-AI&rsquo;s equity mandate and constitutes grounds for project rejection by the ISC.
          </p>
          <p>
            ICG-AI members agree to establish a Global Fund for AI in Education with an initial capitalization target of $8 billion over a 5-year cycle. Contributions are binding and calculated on a GDP per capita-based formula as follows:
          </p>
          <ul>
            <li>High-income members (GNI per capita above $30,000): annual contribution equal to 0.002% of national GDP</li>
            <li>Upper-middle-income members: annual contribution equal to 0.001% of national GDP</li>
            <li>Lower-middle and low-income members: exempt from mandatory financial contributions; eligible for disbursements as recipient states</li>
          </ul>
          <p>
            Disbursements are allocated on an application-based approach through submission of projects to an International Scientific Committee (ISC), composed of independent experts in AI, education, development economics, and data governance, appointed through a transparent multilateral nomination process with guaranteed representation from Global South regions. The ISC evaluates applications against technical feasibility, equity impact, and alignment with national sovereignty principles&mdash;and its decisions are binding on fund management. A minimum of 60% of total fund disbursements must be directed to lower-middle and low-income countries. A first replenishment review is triggered automatically at year 3.
          </p>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">Amendment 5.B &mdash; Infrastructure Investment Floors</h3>
          <p>
            From the Global Fund, ICG-AI shall guarantee the following minimum investment commitment: up to $200 million per least-developed country over the 5-year cycle, covering connectivity, compute capacity, and data infrastructure for national AI model deployment.
          </p>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">Amendment 5.C &mdash; National Deployment Support</h3>
          <p>
            ICG-AI shall co-finance the establishment of national multidisciplinary AI-in-education teams in eligible countries, comprising a network of specialists&mdash;educators, data scientists, linguists, and domain experts. ICG-AI covers up to 60% of team costs for the first 3 years, with full transition to national financing by year 5. All tools and models developed under this support must remain free of charge to learners and educators throughout the deployment lifecycle, including after the national financing transition.
          </p>
          <p>
            National teams are responsible for the curation, validation, and continuous expansion of nationally-owned training datasets, built from locally produced educational content, curricula, and knowledge systems. These datasets must reflect the linguistic, cultural, and pedagogical diversity of the country and serve as the primary training input for any AI model deployed in national education systems. Reliance on externally produced, predominantly Western or Anglophone datasets as the sole or primary training base is incompatible with ICG-AI&rsquo;s data sovereignty standards and constitutes grounds for ISC review.
          </p>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">Amendment 5.D &mdash; Data Representativeness and Bias Mitigation Standards</h3>
          <p>All AI models funded or endorsed through ICG-AI must meet binding data representativeness standards prior to deployment. Specifically:</p>
          <p>
            Models must demonstrate that their training data reflects the linguistic, cultural, and socioeconomic diversity of the target population, including representation of local languages, indigenous knowledge systems, and non-Western pedagogical frameworks.
          </p>
          <p>
            Any model found to reproduce Western-centric or Anglophone-centric bias&mdash;including systematic underperformance for non-English speakers, rural learners, or students from low-income backgrounds&mdash;must undergo mandatory remediation before deployment and may not receive ICG-AI funding until bias benchmarks are met.
          </p>
          <p>
            ISC project evaluations must include a mandatory bias and representativeness audit, conducted by independent reviewers with expertise in the relevant linguistic and cultural contexts, as a condition for fund disbursement.
          </p>
          <p>
            Member states retain the right to reject or suspend any externally developed model that fails to meet national data representativeness standards, without prejudice to their eligibility for ICG-AI funding.
          </p>

          <h3 className="mt-10 text-lg font-bold text-[#1a1a2e]">Amendment 5.E &mdash; Stakeholder Representation and Collaborative Governance</h3>
          <p>
            To ensure the Global Fund serves all populations fairly, the ICG-AI shall establish a Multi-Stakeholder Advisory Council that directly advises the International Scientific Committee. Institutional stakeholders representing expansive demographic and cultural networks will hold fundamental representation on this council. This guarantees that local data sovereignty, linguistic diversity, and strict ethical standards remain the absolute foundation of all funded projects.
          </p>
          <p>
            To ensure these ethical guidelines foster rather than stifle innovation, private technology developers and vendors will also hold dedicated advisory roles. This provides them with a clear voice in determining the practical feasibility of deployments. It creates a highly regulated, mutually beneficial environment where we can refine unbiased global models using strictly anonymized and ethically sourced regional data, in direct exchange for infrastructure investment.
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-16 border-t border-gray-200 pt-8 text-center">
          <Link href="/" className="text-sm font-medium text-[#511E84] transition hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-[#1a1a2e] px-6 py-10 text-center text-white">
        <Image src="/simuvaction-logo.png" alt="SimuVaction" width={120} height={30} className="mx-auto h-8 w-auto" />
        <p className="mt-3 text-xs text-white/40">
          &copy; {new Date().getFullYear()} SimuVaction on AI &mdash; GCTAI
        </p>
      </footer>
    </div>
  );
}
