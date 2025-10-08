const paragraphData = [
    // --- EASY LEVEL: Simple writing, low capitalization, no complex punctuation ---
    { 
        id: 1, 
        title: "The Simple Joy of a Sunny Day", 
        level: "easy", 
        text: "i like to sit outside when the weather is nice. the sun feels warm on my face and i watch the small birds fly by. a little dog runs past the park and its tail wags quickly. everything is calm and easy in the bright afternoon light. i can hear the quiet sound of leaves moving in the gentle wind. it is a good time to just relax and clear my mind. everyone should take a few minutes to enjoy these simple and basic pleasures. these moments are often the best part of any regular day." 
    },
    { 
        id: 2, 
        title: "Learning How to Bake a Cake", 
        level: "easy", 
        text: "first i need a big bowl to mix the flour and sugar together. i must be sure to add the eggs one by one and stir them well. then i pour in some milk and a bit of vanilla extract for good smell. the oven needs to be set to three hundred fifty degrees to bake the cake slowly. i put the batter into a round metal pan and slide it inside the heat. after about thirty minutes the cake is ready to eat. i check it with a toothpick to see if the center is clean and dry. if it is clean then the whole cake is done." 
    },
    { 
        id: 3, 
        title: "Visiting the Public Library Quietly", 
        level: "easy", 
        text: "the library is a very quiet place where we must not make noise. there are long shelves full of many different kinds of books to read. i walk slowly through the rows looking for a mystery novel i haven't finished yet. i sit down at a wooden table near a window and open the cover of the book. the pages smell like old paper and knowledge. i read for an hour until it is time to go home for dinner. i always check out three new books for the next week of reading time." 
    },
    
    // --- MEDIUM LEVEL: Standard writing, common capitalization, clear flow ---
    { 
        id: 4, 
        title: "The Importance of Regular Exercise", 
        level: "medium", 
        text: "Maintaining a routine of regular physical activity is fundamental to overall health and well-being. Exercise helps to strengthen the cardiovascular system, improving the efficiency with which the heart pumps blood. It also plays a crucial role in weight management by increasing metabolism and burning calories effectively. Experts recommend aiming for at least thirty minutes of moderate activity, such as brisk walking or jogging, most days of the week. This commitment not only impacts physical health but also provides significant mental benefits, including reduced stress and anxiety levels. Moreover, consistent training can improve the quality of your sleep. Starting small and gradually increasing intensity is the best way to build a sustainable and enjoyable fitness habit that lasts a lifetime." 
    },
    { 
        id: 5, 
        title: "Understanding Basic Financial Planning", 
        level: "medium", 
        text: "Good financial planning begins with establishing a clear, detailed budget to track where your money is going each month. It is important to distinguish between essential fixed expenses and variable discretionary spending. Setting aside a portion of income for savings, preferably into an emergency fund covering three to six months of living expenses, is highly advisable. Next, focus on eliminating high-interest debt, as this can severely restrict future wealth growth. Finally, consider beginning basic investments like index funds, which offer a simple path to long-term market growth. Consistent saving, disciplined spending, and early investing form the bedrock of a stable and prosperous financial future. Never underestimate the power of compounding interest over a long period of time." 
    },
    { 
        id: 6, 
        title: "The Process of Writing an Engaging Story", 
        level: "medium", 
        text: "Crafting a truly engaging story requires careful attention to character development, plot structure, and narrative pace. Every story needs a compelling protagonist whose desires and flaws drive the action forward. The plot should follow a classic arc, beginning with exposition, escalating to a clear climax, and concluding with a satisfying resolution. Conflict, whether internal or external, is the necessary fuel that keeps the reader invested and turning the pages eagerly. Furthermore, strong descriptive language should be used to build a vivid setting, allowing the reader to fully visualize the world of the story. Revision is often the most important step; first drafts are for getting the words down, but subsequent drafts are for making the writing effective and polished. Focus on making every sentence count towards the overall emotional or thematic impact." 
    },
    
    // --- HARD LEVEL: Long, winding sentences, varied punctuation (:, ;, ""), advanced vocabulary ---
    { 
        id: 7, 
        title: "Exploring Post-War Existential Philosophy", 
        level: "hard", 
        text: "Existentialism, a philosophical movement that gained profound traction in the mid-20th century following the devastating world wars, fundamentally asserts that 'existence precedes essence'; that is to say, individuals are born into the world as a blank slate and must define their meaning through choice and action. Key thinkers, including Jean-Paul Sartre and Albert Camus, explored the concepts of freedom, responsibility, and the inevitable anxiety that arises from facing the sheer absence of inherent purpose in a chaotic universe. Sartre posited that we are 'condemned to be free,' for every decision we make reflects not only on ourselves but upon humanity as a whole, creating a crippling weight of responsibility; this is a central theme in works like 'Being and Nothingness.' Camus, meanwhile, focused on the 'absurd,' the irreconcilable conflict between our innate human desire for meaning and the universe’s cold, meaningless silence. Navigating these dense philosophical concepts while maintaining a steady typing rhythm demands intense focus, particularly as you encounter semicolons, complex dependent clauses, and less common vocabulary such as 'intractable' and 'epistemology.'" 
    },
    { 
        id: 8, 
        title: "Advanced Concepts in Modern Astrophysics", 
        level: "hard", 
        text: "The current model of cosmology, known as Lambda-CDM, provides a framework for understanding the universe’s evolution, incorporating both dark energy (Lambda) and cold dark matter (CDM). Dark energy, a mysterious, pervasive force, is primarily responsible for the accelerating expansion of the cosmos, counteracting the gravitational pull that would otherwise cause deceleration. Dark matter, conversely, is the non-baryonic material that accounts for the majority of the universe's mass; its gravitational effects are observed in galactic rotation curves, which cannot be explained by visible matter alone. Observational evidence from the Cosmic Microwave Background (CMB) radiation, the afterglow of the Big Bang, provides crucial input, showing that the early universe was remarkably homogeneous, yet contained the slight density fluctuations necessary for structure formation. Therefore, understanding the interplay between these dominant components is essential for predicting the ultimate fate of the universe, whether it be a 'Big Freeze' or a 'Big Rip.' This text is specifically constructed with long clauses and advanced terminology to push your endurance and accuracy." 
    },
    
    // --- PROFESSIONAL LEVEL: Technical jargon, numbers, symbols, capitalization, full conceptual density ---
    { 
        id: 9, 
        title: "Designing Robust RESTful API Architectures (Technical)", 
        level: "professional", 
        text: "A highly robust RESTful API should strictly adhere to the six guiding constraints of the REST paradigm: Client-Server separation; Stateless operation, ensuring no session state is maintained on the server; Cacheable resources, optimized via HTTP caching headers like ETag and Last-Modified; a Uniform Interface, mandating the use of standard HTTP methods (GET, POST, PUT, DELETE) for resource manipulation; a Layered System, allowing intermediaries like load-balancers; and Code-On-Demand (optional). Furthermore, optimal API design necessitates careful resource naming (e.g., /api/v1/users/501), appropriate use of HTTP status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found), and robust input validation using schema tools like JSON Schema or TypeScript interfaces. Authentication mechanisms often utilize OAuth 2.0 or JWT (JSON Web Tokens) transmitted via the Authorization: Bearer header. Successfully navigating this dense, technical text requires absolute mastery over capitalization, numbers, and the precise use of symbols like slashes (/), colons (:), and hyphens (-)." 
    },
    { 
        id: 10, 
        title: "The Intricacies of Modern Frontend State Management (Technical)", 
        level: "professional", 
        text: "Effective state management in complex single-page applications (SPAs) often requires libraries like Redux or Zustand to manage global application state predictably. The core Redux pattern involves a single source of truth (the Store), read-only State, and pure functions (Reducers) to handle state transitions. When a user interacts, a Dispatch function sends an Action object (with 'type' and 'payload') to the Reducer. The Reducer then returns a new, immutable state. For asynchronous operations, middleware such as Redux Thunk or Redux Saga is essential for intercepting Actions before they reach the Reducer. Modern alternatives prioritize simplicity; for instance, React Context plus custom Hooks provide a lightweight solution for sharing state without prop drilling. Ultimately, the choice between centralized management and localized component state depends heavily on the application's complexity, team size, and the need for rigorous debugging via tools like the Redux DevTools Extension. This paragraph challenges your ability to fluently type technical terminology, acronyms, and specific naming conventions under pressure." 
    }
];