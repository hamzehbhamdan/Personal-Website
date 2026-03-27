
export const personalInfo = {
    name: "Hamzeh Hamdan",
    title: "Software Engineer at Cresset Capital",
    bio: "I'm a Software Engineer at Cresset Capital in Chicago, where I work across the AI stack—from training teams and building custom solutions to vendor collaboration and compliance monitoring. I recently graduated with honors from Harvard University, where I studied Computer Science and Statistics and wrote my senior thesis on cross-market economic spillovers between the U.S. and Chinese stock markets.",
    bioEducation: "",
    fullBio: "I am currently a Software Engineer at Cresset Capital in Chicago, where I design and build AI infrastructure that supports business operations across the entire organization. My work focuses on driving enterprise-wide AI adoption, architecting intelligent agent systems, and developing analytics frameworks for usage monitoring and compliance. My background is in Computer Science and Statistics from Harvard University, where I conducted research on cross-market economic spillovers and developed AI agents for campus data. I am passionate about building scalable, impactful solutions that bridge the gap between advanced technology and real-world application.",
    email: "hamzeh@alumni.harvard.edu",
    phone: "915 383 5070",
    location: "Chicago, IL",
    linkedin: "https://www.linkedin.com/in/hamzeh-hamdan/",
    github: "https://github.com/hamzehbhamdan",
    resume: "/Hamzeh_Hamdan_Resume.pdf", // We might need to copy this too
};

export const education = {
    institution: "Harvard University",
    degree: "A.B. in Computer Science and Statistics (Honors), Minor in Mathematics",
    date: "May 2025",
    thesis: {
        title: "Cross-Market Signals: Economic Spillovers Across Markets",
        description: "This thesis investigates the interconnectedness of the U.S. and Chinese stock markets, analyzing how macroeconomic factors from one country affect the equity returns of the other. Using statistical and machine learning models on the Jensen, Kelly, and Pedersen Global Factors dataset, the study finds strong spillover effects from the U.S. to China, but minimal effects in the reverse direction.",
        link: "/files/Senior_Thesis.pdf"
    },
    courses: {
        math: [
            "Graph Theory (AM 107)",
            "Complex and Fourier Analysis (AM 104)",
            "Mathematical Modeling (AM 115)",
            "Game Theory (EC 1057)"
        ],
        cs: [
            "Systems Development (AC 207)",
            "Systems Programming and Machine Organization (CS 61)",
            "Algorithms (CS 120)",
            "Software Engineering with Generative AI (CS 106)",
            "Big Data (EC 50)"
        ],
        stats: [
            "Probability (STAT 110)",
            "Data Science (AC 209A, STAT 109B)",
            "Statistical Inference (STAT 111)",
            "Linear Models (STAT 139)",
            "Sports Analytics (STAT 106)"
        ]
    }
};

export const experience = [
    {
        role: "Software Engineer",
        company: "Cresset Capital",
        location: "Chicago, IL",
        date: "Oct 2025 – Present",
        description: "Building AI infrastructure to support business operations across the organization.",
        details: [
            "Design and build internal AI systems that enable teams across the firm to use large language models in business workflows.",
            "Built an AI governance system that monitors model outputs and supports review of flagged responses.",
            "Built analytics dashboards to measure AI adoption and usage across teams.",
            "Collaborate with data, cybersecurity, and IT teams to design safe and scalable approaches for deploying AI tools internally.",
            "Serve as one of the firm's OpenAI platform administrator, managing access, usage policies, and platform configuration."
        ]
    },
    {
        role: "Finance Intern",
        company: "Comcast",
        location: "Philadelphia, PA",
        date: "May 2024 – May 2025",
        description: "Developed internal generative AI tools.",
        details: [
            "Developed the first internal generative AI tool for finance teams using the Azure OpenAI API.",
            "Integrated database connections and management, file search, report generation, and data analysis and visualization in the application through a Python user interface.",
            "Initial testing with equity-based compensation analyses reports increased efficiency by ~93%."
        ]
    },
    {
        role: "Data Science Intern",
        company: "Propel Bio Partners",
        location: "Remote",
        date: "Jan 2024 – Feb 2024",
        description: "Biotech Hedge Fund ($150M AUM).",
        details: [
            "Built a Python class to run Monte Carlo simulations for portfolio-return and risk estimation and created a dashboard for results visualization.",
            "Provided methods to quantify margin of error on long-term investment success probabilities."
        ]
    }
];

export const harvardActivities = [
    {
        title: "Consulting on Business and the Environment (CBE)",
        role: "Board Member",
        details: [
            "Led a team sourcing $550k in cases (37% increase).",
            "Trained analysts on Porter's Five Forces, SWOT, and MECE recommendations.",
            "Led cases in pharma and fintech concerning risk assessment and market-entry."
        ]
    },
    {
        title: "NATO HQ Presentation",
        role: "Researcher (Undergraduate Foreign Policy Initiative)",
        details: [
            "Researched applications of AI and quantum computing on climate change and energy security.",
            "Developed investment recommendations and presented findings directly at NATO Headquarters."
        ]
    },
    {
        title: "Harvard Summer Camp (HMC)",
        role: "Instructor",
        details: [
            "Taught AI concepts and tools like Windsurf to high school students.",
            "Mentored students on building their own AI-enabled projects."
        ]
    },
    {
        title: "MIT iQuHACK 2024",
        role: "Award Winner (2nd Place in Moody’s Challenge)",
        details: [
            "Developed a mean-VaR portfolio optimization algorithm using simulated quantum annealing.",
            "Framed as a quadratic unconstrained binary optimization problem."
        ]
    },
    {
        title: "VeritasGPT",
        role: "Co-Lead",
        details: [
            "Co-led development of a Harvard campus AI agent using RAG and function calling.",
            "Engineered valid retrieval pipelines for course/dining data."
        ]
    }
];

export const activities = [
    {
        role: "Board Member",
        organization: "Consulting on Business and the Environment",
        description: "Consulting on Business and the Environment",
        details: [
            "Led a team that sourced $550k in consulting cases in 4 weeks, a 37% increase from our previous record cycle.",
            "Trained Managing Directors and their sourcing teams on email scraping and sending, sales calls, and writing project briefs and SOWs.",
            "Organized analyst trainings on business/industry analysis models (Porter's Five Forces, SWOT) and creating MECE recommendations.",
            "Led several cases across the pharmaceutical and fintech industries, working on risk assessments, market analyses of new technologies, and market-entry strategies."
        ]
    },
    {
        role: "Co-Lead",
        organization: "VeritasGPT - Harvard AI Agent",
        description: "Machine Intelligence Community",
        details: [
            "Co-led the development of VeritasGPT, an LLM application that navigates Harvard course, dining hall, transportation, and academic calendar data.",
            "Engineered prompts and retrieval pipelines to improve context awareness and accuracy.",
            "Led the Python backend and vector database development, deploying a demo of core features."
        ]
    },
    {
        role: "Researcher",
        organization: "Undergraduate Foreign Policy Initiative",
        description: "Undergraduate Foreign Policy Initiative",
        details: [
            "Researched emerging and disruptive technologies, with a focus in applications of AI and quantum computing on climate change and energy.",
            "Developed investment recommendations for NATO and presented at HQ."
        ]
    },
    {
        role: "Award Winner",
        organization: "MIT iQuHACK 2024",
        description: "2nd Place in Moody’s Challenge",
        details: [
            "Developed a mean-VaR portfolio optimization algorithm, framed as a quadratic unconstrained binary optimization problem and solved using simulated quantum annealing."
        ]
    }
];

export const projects = [
    {
        title: "Redesigning Opportunity",
        slug: "redesigning-opportunity",
        type: "Data Science / Public Policy",
        image: "/images/projects/opportunityatlas.png",
        description: "Based on Raj Chetty's Opportunity Atlas, this tool helps parents assess demographics and opportunities in their zipcodes, exploring local community and school options.",
        tags: ["Data Science", "Public Policy", "Opportunity Atlas", "AI"],
        links: []
    },
    {
        title: "Advanced Cryptocurrency Time Series Analysis",
        slug: "advanced-cryptocurrency-time-series-analysis",
        type: "Data Science / Financial Analysis",
        image: "/images/projects/crypto.png",
        description: "A comprehensive analysis of Bitcoin (BTC) and Ethereum (ETH) price movements, implementing various time series analysis techniques, machine learning models, and deep learning architectures. The project goes beyond traditional ARIMA modeling to incorporate advanced neural network architectures, feature engineering with external data sources, and pairs trading strategies.",
        tags: ["Finance", "ML", "Data Science"],
        links: [
            { label: "View Jupyter Notebook", url: "https://drive.google.com/file/d/1_vvri7xVcfAOBQWfqz6rTC0SDdm5T4-n/view?usp=sharing" },
            { label: "Watch Video", url: "/files/crypto/Presentation.mp4" }
        ]
    },
    {
        title: "Predicting Stock Price Variation",
        slug: "predicting-stock-price-variation",
        type: "Data Science / Financial Modeling",
        image: "/images/projects/financialindicators.png",
        description: "This project focuses on predicting the movements of stocks over time based on various financial and economic indicators. The goal is to determine the most important financial indicators affecting stock prices and develop an accurate predictive model. The analysis includes feature importance analysis, model training with various machine learning algorithms, and performance evaluation across different market conditions.",
        tags: ["Finance", "ML", "Data Science"],
        links: [
            { label: "View on GitHub", url: "https://github.com/hamzehbhamdan/Financial-Indicators-Analysis" },
            { label: "View Jupyter Notebook", url: "https://drive.google.com/file/d/15OK1pM2zkGT_nz0vcKKYfKEU9qeWdXiy/view?usp=sharing" },
            { label: "View PDF", url: "/files/Financial Indicators.pdf" }
        ]
    },
    {
        title: "Baseball Analytics: Creating a Betting Edge",
        slug: "baseball-analytics-creating-a-betting-edge",
        type: "Sports Analytics / Data Science",
        image: "/images/projects/baseballbetting.png",
        description: "This study dives into how specific metrics influence success in baseball, analyzing hitting, pitching, and fielding metrics to understand team performance. The project combines statistical rigor with domain knowledge to provide insights that can influence roster-building decisions, tactical approaches, and broadcasting narratives. The findings bridge the gap between traditional baseball insights and modern predictive techniques.",
        tags: ["Sports"],
        links: [
            { label: "View PDF", url: "/files/Baseball Betting.pdf" }
        ]
    },
    {
        title: "Analysis of NFL Two-Point Conversions",
        slug: "analysis-of-nfl-two-point-conversions",
        type: "Sports Analytics / Game Theory",
        image: "/images/projects/NFL.png",
        description: "Modeling when coaches should go for two-point attempts versus extra points based on game situations and analytics.",
        tags: ["Sports"],
        links: []
    },
    {
        title: "Modeling Baseball Games with Monte Carlo",
        slug: "modeling-baseball-games-with-monte-carlo",
        type: "Sports Analytics / Simulation",
        image: "/images/projects/baseballmontecarlo.png",
        description: "Estimating player value and team performance using Monte Carlo simulations with high school baseball statistics.",
        tags: ["Sports"],
        links: []
    },
    {
        title: "Analyzing Similarity of Companies Using 10-K Filings",
        slug: "analyzing-similarity-of-companies-using-10-k-filings",
        type: "Data Science / NLP",
        image: "/images/projects/10k.png",
        description: "Provides methods for assessing company similarity using specified sub-sections of 10-K filings. Uses cosine similarity of BERT embeddings for similarity.",
        tags: ["Finance", "ML", "NLP"],
        links: [
            { label: "View Demo", url: "https://10k-filings-analysis.streamlit.app/" },
            { label: "View Code", url: "https://github.com/hamzehbhamdan/10-K-Text-Clustering/" },
            { label: "Download PDF", url: "/files/10-K Embeddings.pdf" }
        ]
    },
    {
        title: "Simulating Firm Behavior Under Duopolies",
        slug: "simulating-firm-behavior-under-duopolies",
        type: "Game Theory x Microeconomic Modelling",
        image: "/images/projects/gametheory.png",
        description: "A model of firm behavior under a duopoly using classical microecnonimic multivariate maximization and game theory.",
        tags: ["Finance", "Game Theory"],
        links: []
    },
    {
        title: "Understanding ChatGPT: Neural Networks from Scratch",
        slug: "understanding-chatgpt-neural-networks-from-scratch",
        type: "Computer Science x Mathematics",
        image: "/images/projects/neuralnetworks.png",
        description: "An explanation of how ChatGPT works from the ground up. Topics include basic neural networks, recurrent neural networks, and long short-term memory networks.",
        tags: ["AI", "ML", "Other"],
        links: [
            { label: "Download PDF", url: "/files/Math_157_Final_Project.pdf" }
        ]
    },
    {
        title: "Exploring Racial Inequality in El Paso: A Big Data Approach",
        slug: "exploring-racial-inequality-in-el-paso-a-big-data-approach",
        type: "Big Data",
        image: "/images/projects/inequality.png",
        description: "A tract-level correlational analysis of economic growth factors, such as education and employment rate, on income, separated by gender and race.",
        tags: ["Opportunity", "Other"],
        links: []
    },
    {
        title: "Computer Graphics",
        slug: "computer-graphics",
        type: "Linear Algebra",
        image: "/images/projects/graphics.png",
        description: "An explanation of basic computer graphics. Includes discussions on transformations in 2D and 3D space, quaternions, perspective projections, and shadow mapping.",
        tags: ["Other"],
        links: [
            { label: "Download PDF", url: "/files/Computer Graphics 22a Final Project.pdf" }
        ]
    }
];
