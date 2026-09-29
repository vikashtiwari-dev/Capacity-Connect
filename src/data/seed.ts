import {
  User, Course, Assessment, Notification, Certificate,
  SubjectCompetency, LiveSession, LeaderboardEntry, Badge, DiscussionThread, AuditLog, Feedback
} from "../types";
import { generateAnswerHash } from "../utils/quizSecurity";
import { sigmaWebDevLessons } from "./sigmaWebDevPlaylist";
import { dsaLessons } from "./dsaPlaylist";
import { sqlLessons } from "./sqlPlaylist";
import { cLessons } from "./cPlaylist";
import { pythonLessons } from "./pythonPlaylist";
import { cppDsaLessons } from "./cppDsaPlaylist";
import { dbmsLessons } from "./dbmsPlaylist";
import { cnLessons } from "./cnPlaylist";
import { daaLessons } from "./daaPlaylist";
import { seLessons } from "./sePlaylist";

export const initialBadges: Badge[] = [
  { id: "b1", name: "Quick Starter", description: "Enrolled and completed first orientation module within 24 hours.", icon: "⚡", category: "milestone" },
  { id: "b2", name: "Cloud Architect", description: "Scored 90%+ on Advanced Cloud Infrastructure assessment.", icon: "☁️", category: "mastery" },
  { id: "b3", name: "AI Innovator", description: "Completed enterprise Generative AI project & doubt challenge.", icon: "🤖", category: "mastery" },
  { id: "b4", name: "Top Scorer", description: "Achieved 100% on a subject-wise proctored assessment.", icon: "🏆", category: "achievement" },
  { id: "b5", name: "14-Day Streak", description: "Maintained active daily learning sessions for two straight weeks.", icon: "🔥", category: "milestone" },
  { id: "b6", name: "Peer Mentor", description: "Authored 5 helpful answers in course discussion forums.", icon: "🌟", category: "achievement" }
];

export const initialLeaderboard: LeaderboardEntry[] = [
  { id: "u-trainee-1", name: "Vikash Tiwari", department: "Engineering & Cloud", xp: 4250, streak: 14, coursesCompleted: 4, rank: 1, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
  { id: "u-trainee-2", name: "Arjun Sharma", department: "Data & AI Systems", xp: 3890, streak: 11, coursesCompleted: 3, rank: 2, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
  { id: "u-trainee-3", name: "Priya Patel", department: "Product Strategy", xp: 3420, streak: 9, coursesCompleted: 3, rank: 3, avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
  { id: "u-trainee-4", name: "Rohan Gupta", department: "Cybersecurity Ops", xp: 2950, streak: 7, coursesCompleted: 2, rank: 4, avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
  { id: "u-trainee-5", name: "Ananya Iyer", department: "Engineering & Cloud", xp: 2600, streak: 5, coursesCompleted: 2, rank: 5, avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80" }
];

export const initialUsers: User[] = [
  {
    id: "u-admin-official",
    name: "Capacity Connect Admin",
    email: "vkt052005@gmail.com",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "admin",
    status: "active",
    createdAt: "2026-09-05T08:00:00Z"
  },
  {
    id: "u-trainer-official",
    name: "Raj Tiwari",
    email: "tiwariraj052005@gmail.com",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "trainer",
    status: "active",
    isVerifiedByAdmin: true,
    createdAt: "2026-09-06T09:00:00Z",
    trainerProfile: {
      bio: "Senior Technical Educator & Mentor specializing in Computer Science, Full-Stack Architecture, and Systems Engineering.",
      expertise: ["Full-Stack Architecture", "Data Structures", "System Design", "Cloud Systems"],
      competencies: ["Hands-on Coding", "Curriculum Design", "Real-world Projects", "Systems Architecture"],
      phone: "+91 98765 11111",
      department: "Computer Science & Engineering",
      designation: "Senior Technical Educator & Mentor",
      experience: "10+ Years Technical Education",
      rating: 4.99,
      totalStudentsTaught: 60000,
      verifiedCredentials: ["Senior Technical Faculty", "Verified LMS Instructor"],
      isVerifiedByAdmin: true
    }
  },
  {
    id: "u-trainer-codewithharry",
    name: "CodeWithHarry (Haris Khan)",
    email: "codewithharry@gmail.com",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "trainer",
    status: "active",
    isVerifiedByAdmin: true,
    createdAt: "2026-09-06T10:00:00Z",
    trainerProfile: {
      bio: "Master Software Educator, Creator of Sigma Web Development & Python 100 Days. Over 6M+ students trained globally.",
      expertise: ["Full-Stack Architecture", "Python", "JavaScript", "C Programming"],
      competencies: ["Hands-on Coding", "Curriculum Design", "Real-world Projects"],
      phone: "+91 98765 44444",
      department: "Computer Science & Engineering",
      designation: "Principal Technical Educator & Founder, CodeWithHarry",
      experience: "10+ Years Technical Education",
      rating: 4.99,
      totalStudentsTaught: 6000000,
      verifiedCredentials: ["CodeWithHarry Founder", "Top Developer Educator"],
      isVerifiedByAdmin: true
    }
  },
  {
    id: "u-trainee-official",
    name: "Madhav Kumar",
    email: "t2005madhav@gmail.com",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "trainee",
    status: "active",
    createdAt: "2026-09-05T15:30:00Z",
    traineeProfile: {
      bio: "Dedicated Engineering scholar actively acquiring advanced competencies on Capacity Connect.",
      phone: "+91 98765 00000",
      department: "Computer Science & Engineering",
      designation: "Undergraduate Student",
      qualifications: ["B.Tech Computer Science (In Progress)"],
      experience: ["Student Scholar"],
      skills: ["Full-Stack Web Development", "Cloud Infrastructure", "System Design"],
      interests: ["Cloud Systems", "AI", "Microservices"],
      certificates: [],
      xpPoints: 1250,
      streakDays: 4,
      completedCoursesCount: 1,
      badges: []
    }
  },
  {
    id: "u-trainer-striver",
    name: "Raj Vikramaditya (Striver)",
    email: "striver@takeuforward.org",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "trainer",
    status: "active",
    isVerifiedByAdmin: true,
    createdAt: "2026-09-05T09:00:00Z",
    trainerProfile: {
      bio: "Ex-Google, Ex-Amazon Software Engineer. Founder of take U forward and creator of the A2Z DSA Course.",
      expertise: ["Data Structures & Algorithms", "Competitive Programming", "System Design"],
      competencies: ["Algorithm Design", "Dynamic Programming", "Interview Preparation"],
      phone: "+91 98765 22222",
      department: "Computer Science & Engineering",
      designation: "Principal Algorithms Instructor",
      experience: "8+ Years Engineering & Mentorship",
      rating: 4.99,
      totalStudentsTaught: 500000,
      verifiedCredentials: ["take U forward Founder", "Competitive Programming Master"],
      isVerifiedByAdmin: true
    }
  },
  {
    id: "u-trainer-carter",
    name: "Carter Zenke",
    email: "carter@cs50.harvard.edu",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "trainer",
    status: "active",
    isVerifiedByAdmin: true,
    createdAt: "2026-09-05T09:15:00Z",
    trainerProfile: {
      bio: "Lecturer on Computer Science at Harvard University & Lead Instructor for CS50's Introduction to Databases with SQL.",
      expertise: ["Relational Databases", "SQL", "Database Design", "PostgreSQL", "SQLite"],
      competencies: ["Relational Algebra", "Schema Optimization", "Database Architecture"],
      phone: "+1 617 495 1000",
      department: "Harvard Division of Continuing Education & SEAS",
      designation: "Harvard CS50 Lead Instructor",
      experience: "7+ Years Academic Instruction",
      rating: 4.99,
      totalStudentsTaught: 750000,
      verifiedCredentials: ["Harvard University Faculty", "CS50 Lead Instructor"],
      isVerifiedByAdmin: true
    }
  },
  {
    id: "u-trainer-shradha",
    name: "Shradha Khapra",
    email: "shradha@apnacollege.in",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "trainer",
    status: "active",
    isVerifiedByAdmin: true,
    createdAt: "2026-09-05T09:30:00Z",
    trainerProfile: {
      bio: "Ex-Microsoft Software Engineer, Co-Founder of Apna College. One of India's most recognized programming educators.",
      expertise: ["C++", "Data Structures & Algorithms", "Full Stack Development"],
      competencies: ["DSA Problem Solving", "C++ STL", "Interview Preparation"],
      phone: "+91 98765 33333",
      department: "Computer Science & Engineering",
      designation: "Co-Founder & Lead Instructor, Apna College",
      experience: "6+ Years Tech Industry & Mentorship",
      rating: 4.98,
      totalStudentsTaught: 4500000,
      verifiedCredentials: ["Ex-Microsoft Engineer", "Apna College Co-Founder"],
      isVerifiedByAdmin: true
    }
  },
  {
    id: "u-trainer-neso",
    name: "Neso Academy",
    email: "contact@nesoacademy.org",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "trainer",
    status: "active",
    isVerifiedByAdmin: true,
    createdAt: "2026-09-05T09:45:00Z",
    trainerProfile: {
      bio: "Globally acclaimed engineering education platform delivering foundational computer science and electrical engineering courses.",
      expertise: ["Database Management Systems", "Digital Electronics", "Operating Systems"],
      competencies: ["Relational Theory", "Normalization", "Concurrency Control", "Transaction Management"],
      phone: "+91 98765 44444",
      department: "Computer Science & Engineering",
      designation: "Senior Academic Faculty",
      experience: "12+ Years University Curriculum",
      rating: 4.97,
      totalStudentsTaught: 2200000,
      verifiedCredentials: ["Neso Academy Academic Lead", "Global STEM Contributor"],
      isVerifiedByAdmin: true
    }
  },
  {
    id: "u-trainer-varun",
    name: "Varun Singla",
    email: "varun@gatesmashers.com",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "trainer",
    status: "active",
    isVerifiedByAdmin: true,
    createdAt: "2026-09-05T10:00:00Z",
    trainerProfile: {
      bio: "Founder of Gate Smashers, India's most popular GATE CSE educator known for intuitive, high-yield conceptual explanations.",
      expertise: ["Computer Networks", "Operating Systems", "Theory of Computation"],
      competencies: ["OSI/TCP-IP Protocols", "Network Security", "Routing Algorithms", "IP Subnetting"],
      phone: "+91 98765 55555",
      department: "Computer Science & Engineering",
      designation: "Founder & Lead Educator, Gate Smashers",
      experience: "11+ Years GATE & University Training",
      rating: 4.99,
      totalStudentsTaught: 1800000,
      verifiedCredentials: ["Gate Smashers Founder", "Master GATE Educator"],
      isVerifiedByAdmin: true
    }
  },
  {
    id: "u-trainer-sanchit",
    name: "Sanchit Jain",
    email: "sanchit@knowledgegate.in",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "trainer",
    status: "active",
    isVerifiedByAdmin: true,
    createdAt: "2026-09-05T10:15:00Z",
    trainerProfile: {
      bio: "Founder of KnowledgeGATE, renowned educator specializing in Algorithm Design, Theory of Computation, and GATE CS.",
      expertise: ["Design & Analysis of Algorithms", "Asymptotic Analysis", "Dynamic Programming", "Greedy Techniques"],
      competencies: ["Time & Space Complexity", "Divide & Conquer", "Graph Algorithms", "NP-Completeness"],
      phone: "+91 98765 66666",
      department: "Computer Science & Engineering",
      designation: "Founder & Principal Faculty, KnowledgeGATE",
      experience: "10+ Years Algorithm Mastery",
      rating: 4.96,
      totalStudentsTaught: 1200000,
      verifiedCredentials: ["KnowledgeGATE Founder", "GATE CS Specialist"],
      isVerifiedByAdmin: true
    }
  },
  {
    id: "u-trainer-rajib",
    name: "Prof. Rajib Mall",
    email: "rajib@cse.iitkgp.ac.in",
    password: "$2b$10$B6FQadt.SIcbPwDw26ugFeaGnKzp6Fm3FeWy96wFZCNXloFEcjMIW",
    role: "trainer",
    status: "active",
    isVerifiedByAdmin: true,
    createdAt: "2026-09-05T10:30:00Z",
    trainerProfile: {
      bio: "Professor in the Department of Computer Science & Engineering at IIT Kharagpur. World-renowned authority and author on Software Engineering.",
      expertise: ["Software Engineering", "Object-Oriented Design", "Software Testing", "Agile & Waterfall Models"],
      competencies: ["Software Architecture", "UML Modeling", "Reliability Engineering", "Function Point Analysis"],
      phone: "+91 3222 282222",
      department: "Department of Computer Science & Engineering, IIT Kharagpur",
      designation: "Professor & Author, IIT Kharagpur",
      experience: "30+ Years Academic & Research Excellence",
      rating: 4.98,
      totalStudentsTaught: 950000,
      verifiedCredentials: ["IIT Kharagpur Senior Faculty", "Author of Fundamentals of Software Engineering"],
      isVerifiedByAdmin: true
    }
  }
];

export const initialCourses: Course[] = [
  {
    id: "c6",
    title: "Web Development Course",
    description: "The complete hands-on roadmap to becoming a full stack web developer: learn semantic HTML5, modern CSS3 & Flexbox, vanilla JavaScript ES6+, DOM manipulation, Node.js runtime, Express backend, MongoDB database, and React & Next.js.",
    trainerId: "u-trainer-codewithharry",
    trainerName: "CodeWithHarry (Haris Khan)",
    category: "Technical",
    thumbnail: "/thumbnails/webdev-course.jpg",
    duration: "85+ Hours • 139 Lessons",
    level: "Beginner",
    status: "active",
    createdAt: "2026-02-15T10:00:00Z",
    rating: 0,
    totalRatings: 0,
    videoUrl: "https://youtube.com/playlist?list=PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w",
    lessons: sigmaWebDevLessons,
    tags: ["Web Development", "HTML5", "CSS3", "JavaScript", "React", "Next.js", "Node.js", "Express", "MongoDB", "Tailwind"],
    syllabus: [
      "Module 1: Internet Fundamentals, HTTP Protocol & Semantic HTML5",
      "Module 2: Modern CSS3, Flexbox, Grid & Responsive Layouts",
      "Module 3: JavaScript Core Fundamentals, Variables, Loops & Functions",
      "Module 4: DOM Manipulation, Event Listeners & Interactive UI Projects",
      "Module 5: Advanced JavaScript: Promises, Async/Await & Fetch API",
      "Module 6: Backend Development with Node.js & Express.js REST APIs",
      "Module 7: Database Design, MongoDB, Mongoose & CRUD Operations",
      "Module 8: Modern Frontend Development with React & Next.js App Router"
    ],
    prerequisites: ["No prior programming experience required", "A computer with Chrome and VS Code installed"],
    resources: [
      {
        id: "r601",
        courseId: "c6",
        title: "Full Stack Web Development Master Notes & Cheatsheet",
        type: "presentation",
        url: "#slides",
        size: "18.5 MB",
        uploadedAt: "2026-02-15T10:00:00Z",
        uploadedBy: "CodeWithHarry (Haris Khan)",
        version: "v3.0",
        summary: "Comprehensive developer handbook covering HTML tags, CSS Flexbox cheatsheet, JavaScript DOM manipulation, Express routes, and React component lifecycles.",
        keyTakeaways: [
          "HTML provides the skeleton, CSS creates the visual layout, and JavaScript adds dynamic interactivity.",
          "Modern responsive design relies on CSS Flexbox and Grid combined with media queries.",
          "JavaScript uses single-threaded non-blocking event loops with Promises and Async/Await for asynchronous actions.",
          "Node.js and Express allow developers to build scalable RESTful backend services using JavaScript.",
          "React utilizes virtual DOM reconciliation and reusable component hooks for fast UI rendering."
        ],
        flashcards: [
          { id: "f601", front: "What is the Box Model in CSS?", back: "The CSS box model consists of content, padding, border, and margin around every HTML element.", category: "CSS" },
          { id: "f602", front: "What is Event Bubbling in the DOM?", back: "Event bubbling is when an event triggers on the innermost target element and then propagates upwards through its parent elements in the DOM tree.", category: "JavaScript" },
          { id: "f603", front: "What is the difference between synchronous and asynchronous code?", back: "Synchronous code executes sequentially and blocks execution; asynchronous code executes in the background and resolves via callbacks, Promises, or async/await.", category: "JavaScript" },
          { id: "f604", front: "What is Middleware in Express.js?", back: "Functions that have access to the request, response, and the next() function in the application's request-response cycle.", category: "Backend" },
          { id: "f605", front: "What is JSX in React?", back: "JSX is a syntax extension for JavaScript that allows you to write HTML-like markup directly inside JavaScript code.", category: "React" }
        ],
        slides: [
          {
            slideNumber: 1,
            title: "Roadmap to Full Stack Engineering",
            bullets: [
              "Frontend: Semantic HTML5, Modern CSS3, Vanilla JS",
              "Advanced Frontend: React.js, Tailwind CSS, Next.js",
              "Backend: Node.js runtime, Express framework, RESTful APIs",
              "Database: MongoDB, Mongoose ODM, NoSQL indexing"
            ],
            keyConcept: "Mastering fundamentals first ensures long-term adaptability as web frameworks evolve."
          },
          {
            slideNumber: 2,
            title: "DOM & Event-Driven Interactivity",
            bullets: [
              "Selecting elements with document.querySelector",
              "Attaching event listeners (click, change, submit)",
              "Manipulating classes and styles dynamically",
              "Preventing default form reloads with e.preventDefault()"
            ],
            keyConcept: "Interactive web pages respond to user actions by dynamically modifying the Document Object Model."
          },
          {
            slideNumber: 3,
            title: "Modern Asynchronous JavaScript",
            bullets: [
              "Call stack, Web APIs, and the Event Loop",
              "Promises (Pending, Fulfilled, Rejected)",
              "Clean asynchronous syntax with async/await",
              "Fetching live data from REST APIs using fetch()"
            ],
            keyConcept: "Async programming enables web apps to fetch remote data without freezing the browser interface."
          }
        ]
      }
    ]
  },
  {
    id: "c-dsa",
    title: "DATA STRUCTURE AND ALGORITHM",
    description: "The complete A2Z Data Structures & Algorithms roadmap by Striver (take U forward). Master Arrays, Binary Search, Strings, Linked Lists, Recursion, Bit Manipulation, Stacks & Queues, Sliding Window, Heaps, Greedy Algorithms, Binary Trees, BSTs, Graphs, Dynamic Programming, Tries, and Advanced DSA with 315 structured video lessons.",
    trainerId: "u-trainer-striver",
    trainerName: "Raj Vikramaditya (Striver)",
    category: "Technical",
    thumbnail: "/thumbnails/dsa-course.jpg",
    duration: "120+ Hours • 315 Lessons",
    level: "Intermediate",
    status: "active",
    createdAt: "2026-03-01T10:00:00Z",
    rating: 0,
    totalRatings: 0,
    videoUrl: "https://youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz",
    lessons: dsaLessons,
    tags: ["Data Structures", "Algorithms", "C++", "Java", "Dynamic Programming", "Graphs", "Binary Trees", "Binary Search", "LeetCode"],
    syllabus: [
      "Module 1: Learn the Basics (C++, Java, Math, Recursion, Time & Space Complexity)",
      "Module 2: Sorting Techniques & Array Problems (Easy, Medium, Hard)",
      "Module 3: Binary Search on 1D/2D Arrays & Search Space",
      "Module 4: Linked List Mastery (Singly, Doubly, Medium & Hard Problems)",
      "Module 5: Recursion & Backtracking (Subsequences, Permutations, N-Queens)",
      "Module 6: Bit Manipulation, Stack & Queues (Prefix/Infix/Postfix, Monotonic Stack)",
      "Module 7: Sliding Window & Two Pointer Problems",
      "Module 8: Binary Trees & Binary Search Trees (Traversals, Views, Construction)",
      "Module 9: Graphs & Graph Algorithms (BFS, DFS, Dijkstra, Topo Sort, Disjoint Set)",
      "Module 10: Dynamic Programming (1D, 2D, Grids, Subsequences, Strings, Stocks, MCM)",
      "Module 11: Tries, Advanced String Algorithms & Hard Interview Problems"
    ],
    prerequisites: ["Basic understanding of programming in C++ or Java"],
    resources: [
      {
        id: "r-dsa-01",
        courseId: "c-dsa",
        title: "Striver's A2Z DSA Handbook & Cheatsheet",
        type: "presentation",
        url: "#slides",
        size: "22.4 MB",
        uploadedAt: "2026-03-01T10:00:00Z",
        uploadedBy: "Raj Vikramaditya (Striver)",
        version: "v4.0",
        summary: "Complete blueprint of algorithmic problem solving, time/space complexities, recursion trees, two-pointer patterns, graph algorithms, and DP memoization tables.",
        keyTakeaways: [
          "Always analyze time and space complexity before choosing a data structure.",
          "Two pointer and sliding window patterns optimize nested O(N^2) loops to linear O(N).",
          "Binary Search can be applied to monotonic functions and optimal answer ranges, not just sorted arrays.",
          "Graphs require clear understanding of BFS (shortest path in unweighted) vs DFS (cycle detection, topological sort).",
          "Dynamic Programming is recursion + memoization to eliminate redundant subproblem recalculations."
        ],
        flashcards: [
          { id: "f-dsa-1", front: "What is the amortized time complexity of inserting into a Dynamic Array (std::vector)?", back: "O(1) amortized, because doubling capacity happens infrequently.", category: "Complexity" },
          { id: "f-dsa-2", front: "When can Binary Search be used on an answer space?", back: "When the predicate function condition(x) is monotonic (e.g. false, false, ..., true, true).", category: "Binary Search" },
          { id: "f-dsa-3", front: "What is Dijkstra's algorithm used for?", back: "Finding single-source shortest paths in graphs with non-negative edge weights in O((V + E) log V) time.", category: "Graphs" },
          { id: "f-dsa-4", front: "How do you detect a cycle in an undirected graph using BFS?", back: "If during traversal you encounter an already visited node that is not the parent of the current node, a cycle exists.", category: "Graphs" },
          { id: "f-dsa-5", front: "What are the two key properties of Dynamic Programming?", back: "Optimal Substructure and Overlapping Subproblems.", category: "DP" }
        ],
        slides: [
          {
            slideNumber: 1,
            title: "Asymptotic Analysis & Big-O",
            bullets: [
              "Worst-case (O), Average-case (Theta), Best-case (Omega)",
              "Common complexities: O(1) < O(log N) < O(N) < O(N log N) < O(N^2) < O(2^N)",
              "Master Theorem for divide-and-conquer recurrences",
              "Auxiliary space vs Total space"
            ],
            keyConcept: "Choose algorithms that stay within 10^8 operations per second limits."
          },
          {
            slideNumber: 2,
            title: "Graph Traversal Mastery",
            bullets: [
              "Adjacency List representation using vector<vector<int>>",
              "Breadth-First Search (queue, level order, shortest path)",
              "Depth-First Search (recursion/stack, component counting)",
              "Cycle detection in directed vs undirected graphs"
            ],
            keyConcept: "Breadth-First Search naturally explores equidistant paths level by level."
          },
          {
            slideNumber: 3,
            title: "Dynamic Programming Strategy",
            bullets: [
              "Identifying overlapping subproblems and optimal substructure",
              "1D DP: Fibonacci, Climbing Stairs, Frog Jump",
              "2D Grid DP: Unique Paths, Minimum Path Sum",
              "DP on Subsequences: 0/1 Knapsack, Target Sum, Coin Change"
            ],
            keyConcept: "Formulate recurrence relations from base cases to achieve polynomial time execution."
          }
        ]
      }
    ]
  },
  {
    id: "c-sql",
    title: "Databases With SQL",
    description: "Harvard CS50's comprehensive university course on Relational Databases and SQL taught by Carter Zenke. Master SQLite, PostgreSQL, and MySQL: learning schema design, normalization, complex multi-table JOINs, indexing with B-Trees, transactions with ACID guarantees, and distributed scaling.",
    trainerId: "u-trainer-carter",
    trainerName: "Carter Zenke (Harvard University)",
    category: "Technical",
    thumbnail: "/thumbnails/sql-course.jpg",
    duration: "22+ Hours • 16 Lessons",
    level: "Intermediate",
    status: "active",
    createdAt: "2026-03-02T10:00:00Z",
    rating: 0,
    totalRatings: 0,
    videoUrl: "https://youtu.be/WXk7yDqsKxs",
    lessons: sqlLessons,
    tags: ["Databases", "SQL", "SQLite", "PostgreSQL", "MySQL", "Database Design", "Indexing", "Transactions", "Harvard CS50"],
    syllabus: [
      "Lecture 0: Querying – SELECT, WHERE, ORDER BY, LIMIT, LIKE, Aggregate Functions",
      "Lecture 1: Relating – Primary Keys, Foreign Keys, Entity Relationships & JOINs",
      "Lecture 2: Designing – Database Normalization (1NF, 2NF, 3NF), Types & Constraints",
      "Lecture 3: Writing – INSERT, UPDATE, DELETE, Triggers, and ACID Transactions",
      "Lecture 4: Viewing – CREATE VIEW, CTEs, Materialized Views & Security",
      "Lecture 5: Optimizing – Query Execution Plans, B-Trees, Indexes & Search Costs",
      "Lecture 6: Scaling – PostgreSQL, MySQL, Distributed Systems, Replication & Sharding"
    ],
    prerequisites: ["Basic familiarity with computational thinking or any programming language"],
    resources: [
      {
        id: "r-sql-01",
        courseId: "c-sql",
        title: "Harvard CS50 SQL Complete Handbook & Syntax Cheatsheet",
        type: "presentation",
        url: "#slides",
        size: "24.2 MB",
        uploadedAt: "2026-03-02T10:00:00Z",
        uploadedBy: "Carter Zenke (Harvard University)",
        version: "v2024.1",
        summary: "Authoritative handbook on relational database theory, SQL queries, join conditions, schema normalization rules, transactions, and indexing.",
        keyTakeaways: [
          "Relational databases organize data into tables consisting of rows and columns with enforced data types.",
          "Primary keys uniquely identify records, while foreign keys establish relationships across tables.",
          "Database normalization (1NF, 2NF, 3NF) reduces data redundancy and prevents update anomalies.",
          "Indexes utilize B-Tree structures to expedite query lookups from O(N) linear scans to O(log N) operations.",
          "ACID properties (Atomicity, Consistency, Isolation, Durability) guarantee transactional reliability."
        ],
        flashcards: [
          { id: "f-sql-1", front: "What is the difference between WHERE and HAVING in SQL?", back: "WHERE filters rows before any groupings are made, while HAVING filters groups created by the GROUP BY clause.", category: "SQL Querying" },
          { id: "f-sql-2", front: "What is a Foreign Key constraint?", back: "A column or group of columns in a relational database table that provides a link between data in two tables, enforcing referential integrity.", category: "Schema Design" },
          { id: "f-sql-3", front: "What are the ACID properties in database transactions?", back: "Atomicity (all or nothing), Consistency (preserves invariants), Isolation (concurrent execution transparency), and Durability (committed data survives crashes).", category: "Transactions" },
          { id: "f-sql-4", front: "How does a B-Tree index accelerate SELECT queries?", back: "By maintaining a self-balancing sorted search tree, reducing disk lookups from O(N) full table scans to O(log N) page reads.", category: "Optimization" },
          { id: "f-sql-5", front: "What is Third Normal Form (3NF)?", back: "A table is in 3NF if it is in 2NF and has no transitive dependencies (non-key attributes depend only on the primary key).", category: "Normalization" }
        ],
        slides: [
          {
            slideNumber: 1,
            title: "Relational Modeling & Schema Foundations",
            bullets: [
              "Tables, attributes, tuples, and relational schemas",
              "Primary key selection and natural vs surrogate keys",
              "Foreign keys, cascade actions (CASCADE, SET NULL, RESTRICT)",
              "One-to-One, One-to-Many, and Many-to-Many entity relationships"
            ],
            keyConcept: "Design clean schemas first to prevent redundancy and anomalous data states."
          },
          {
            slideNumber: 2,
            title: "Joins, Query Plans & Optimization",
            bullets: [
              "Inner Join vs Left/Right/Full Outer Joins",
              "Cross joins and Cartesian product pitfalls",
              "Analyzing queries with EXPLAIN QUERY PLAN",
              "B-Tree index anatomy: root, branch, and leaf pages"
            ],
            keyConcept: "Understanding how the database engine executes queries is the key to writing fast SQL."
          },
          {
            slideNumber: 3,
            title: "Transactions, Concurrency & Scaling",
            bullets: [
              "Transaction control: BEGIN TRANSACTION, COMMIT, ROLLBACK",
              "Isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable",
              "Write-Ahead Logging (WAL) and crash recovery",
              "Horizontal scaling: Read replicas, connection pooling, and sharding"
            ],
            keyConcept: "ACID guarantees preserve data integrity even in distributed, high-concurrency environments."
          }
        ]
      }
    ]
  },
  {
    id: "c-c-prog",
    title: "C Programming Complete Course",
    description: "Master C Language programming from scratch with CodeWithHarry. Covers variables, data types, control flow, functions, recursion, pointers, dynamic memory allocation (malloc, calloc, realloc, free), structs, file I/O, and real-world projects like Snake Water Gun game.",
    trainerId: "u-trainer-codewithharry",
    trainerName: "CodeWithHarry (Haris Khan)",
    category: "Technical",
    thumbnail: "/thumbnails/c-prog-course.jpg",
    duration: "10+ Hours • 14 Chapters & Projects",
    level: "Beginner",
    status: "active",
    createdAt: "2026-03-03T10:00:00Z",
    rating: 0,
    totalRatings: 0,
    videoUrl: "https://youtu.be/aZb0iu4uGwA",
    lessons: cLessons,
    tags: ["C Programming", "Pointers", "Memory Management", "Data Structures", "Low-Level Programming"],
    syllabus: [
      "Chapter 1: Variables, Constants & Keywords",
      "Chapter 2: Instructions & Operators",
      "Chapter 3: Conditional Instructions (if-else, switch)",
      "Chapter 4: Loop Control Instructions (while, do-while, for)",
      "Chapter 5: Functions & Recursion",
      "Chapter 6: Pointers & Pointer Arithmetic",
      "Chapter 7: Arrays & Multi-Dimensional Arrays",
      "Chapter 8: Strings & Standard Library Functions",
      "Chapter 9: Structures & Unions",
      "Chapter 10: File Input & Output",
      "Chapter 11: Dynamic Memory Allocation (malloc, calloc, realloc, free)",
      "Project 1: Number Guessing Game",
      "Project 2: Snake, Water, Gun Game"
    ],
    prerequisites: ["No prior programming experience required", "A computer with GCC or VS Code installed"],
    resources: [
      {
        id: "r-c-01",
        courseId: "c-c-prog",
        title: "Complete C Programming Master Notes & Pointers Blueprint",
        type: "presentation",
        url: "#slides",
        size: "14.2 MB",
        uploadedAt: "2026-03-03T10:00:00Z",
        uploadedBy: "CodeWithHarry (Haris Khan)",
        version: "v2.0",
        summary: "In-depth guide to C syntax, memory allocation with malloc/calloc, pointer arithmetic, struct memory alignment, and recursion.",
        keyTakeaways: [
          "C provides direct memory management and low-level hardware control through pointers.",
          "Dynamic memory allocated with malloc() must always be paired with free() to prevent memory leaks.",
          "Arrays decay into pointers to their first elements when passed to functions.",
          "Structures allow composite data models with continuous byte layout in RAM."
        ],
        flashcards: [
          { id: "f-c-1", front: "What is the difference between malloc() and calloc()?", back: "malloc allocates uninitialized garbage memory, while calloc allocates zero-initialized memory.", category: "Memory" },
          { id: "f-c-2", front: "What is a dangling pointer?", back: "A pointer that references a memory location that has already been deallocated using free().", category: "Pointers" }
        ],
        slides: [
          {
            slideNumber: 1,
            title: "C Memory Layout & The Stack vs Heap",
            bullets: [
              "Text Segment: Compiled executable instructions",
              "Data Segment: Initialized global and static variables",
              "Stack: Function call frames, local variables (auto-managed)",
              "Heap: Dynamic runtime memory allocated via malloc/calloc"
            ],
            keyConcept: "Understanding memory segments is vital for debugging segfaults and optimizing C programs."
          },
          {
            slideNumber: 2,
            title: "Mastering Pointers & References",
            bullets: [
              "Pointer declaration: int *ptr",
              "Address-of operator: &variable",
              "Dereference operator: *ptr",
              "Passing pointers to functions enables in-place mutation"
            ],
            keyConcept: "Pointers hold memory addresses, allowing efficient pass-by-reference semantics."
          }
        ]
      }
    ]
  },
  {
    id: "c-python",
    title: "Python for Beginners (100 Days of Code)",
    description: "The complete 100 Days of Code Python Bootcamp by CodeWithHarry. Learn Python programming from beginner syntax to advanced object-oriented programming, data structures, decorators, generators, file handling, multi-threading, GUI development, and production project creation.",
    trainerId: "u-trainer-codewithharry",
    trainerName: "CodeWithHarry (Haris Khan)",
    category: "Technical",
    thumbnail: "/thumbnails/python-course.jpg",
    duration: "35+ Hours • 100 Lessons",
    level: "Beginner",
    status: "active",
    createdAt: "2026-03-03T10:00:00Z",
    rating: 0,
    totalRatings: 0,
    videoUrl: "https://youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg",
    lessons: pythonLessons,
    tags: ["Python", "100 Days of Code", "OOP", "Data Science", "Automation", "Software Engineering"],
    syllabus: [
      "Days 1-20: Python Fundamentals, Syntax, Loops, Functions & Collections (Lists, Tuples, Dictionaries)",
      "Days 21-40: Advanced Collections, File Handling, Exception Handling & Virtual Environments",
      "Days 41-60: Object-Oriented Programming (Classes, Inheritance, Polymorphism, Encapsulation)",
      "Days 61-80: Advanced Python (Decorators, Generators, Regular Expressions, AsyncIO)",
      "Days 81-100: Real-World Applications, APIs, Multithreading, GUI Projects & Packaging"
    ],
    prerequisites: ["No prerequisites required"],
    resources: [
      {
        id: "r-py-01",
        courseId: "c-python",
        title: "Python 100 Days Complete Cheatsheet & OOP Handbook",
        type: "presentation",
        url: "#slides",
        size: "16.8 MB",
        uploadedAt: "2026-03-03T10:00:00Z",
        uploadedBy: "CodeWithHarry (Haris Khan)",
        version: "v3.2",
        summary: "Comprehensive handbook covering Python idioms, list comprehensions, decorators, OOP classes, generator functions, and automation patterns.",
        keyTakeaways: [
          "Python is dynamically typed and garbage collected with automatic reference counting.",
          "List and dict comprehensions offer concise and fast alternatives to explicit loops.",
          "Generators use yield to lazily stream large datasets with O(1) memory footprint.",
          "Decorators wrap functions to dynamically enhance behavior without modifying source code."
        ],
        flashcards: [
          { id: "f-py-1", front: "What is GIL in CPython?", back: "The Global Interpreter Lock is a mutex that prevents multiple native threads from executing Python bytecodes at once.", category: "Core Python" },
          { id: "f-py-2", front: "What is the difference between list and tuple?", back: "Lists are mutable and defined with [], while tuples are immutable and defined with ().", category: "Data Types" }
        ],
        slides: [
          {
            slideNumber: 1,
            title: "Idiomatic Python & Data Structures",
            bullets: [
              "Lists, Tuples, Sets, and Dictionaries",
              "List comprehensions: [x**2 for x in nums if x > 0]",
              "Unpacking and *args, **kwargs keyword expansion",
              "Context managers with 'with' statements for clean resource closing"
            ],
            keyConcept: "Writing Pythonic code focuses on readability and concise standard library constructs."
          },
          {
            slideNumber: 2,
            title: "Decorators & Generators in Production",
            bullets: [
              "Functions as first-class citizens in Python",
              "Higher-order functions and closure scope",
              "Decorators for timing, authentication, and logging",
              "Generators with yield to stream massive files without memory spikes"
            ],
            keyConcept: "Generators preserve memory by calculating next values only on demand."
          }
        ]
      }
    ]
  },
  {
    id: "c-cpp-dsa",
    title: "Complete C++ DSA Course",
    description: "Master Data Structures & Algorithms with C++ taught by Shradha Khapra (Apna College, Ex-Microsoft). Covers C++ basics, STL, bit manipulation, recursion, backtracking, linked lists, stacks, queues, binary trees, BST, heaps, hashing, graphs, and dynamic programming.",
    trainerId: "u-trainer-shradha",
    trainerName: "Shradha Khapra (Apna College)",
    category: "Technical",
    thumbnail: "/thumbnails/cpp-dsa-course.jpg",
    duration: "50+ Hours • 100 Lessons",
    level: "Intermediate",
    status: "active",
    createdAt: "2026-03-03T10:00:00Z",
    rating: 0,
    totalRatings: 0,
    videoUrl: "https://youtube.com/playlist?list=PLfqMhTWNBTe137I_EPQd34TsgV6IO55pt",
    lessons: cppDsaLessons,
    tags: ["C++", "DSA", "Algorithms", "Data Structures", "LeetCode", "Apna College"],
    syllabus: [
      "Module 1: C++ Foundations, Control Structures & Patterns",
      "Module 2: Arrays, Vectors & C++ Standard Template Library (STL)",
      "Module 3: Sorting & Searching Algorithms (Binary Search & Applications)",
      "Module 4: Strings, Two Pointers & Bit Manipulation",
      "Module 5: Recursion & Backtracking (N-Queens, Sudoku Solver)",
      "Module 6: Linked Lists (Singly, Doubly, Circular & LeetCode problems)",
      "Module 7: Stacks & Queues (Implementation, Expressions & Sliding Window)",
      "Module 8: Binary Trees, Binary Search Trees & Heaps",
      "Module 9: Hashing, Graphs (BFS, DFS, Shortest Paths) & Dynamic Programming"
    ],
    prerequisites: ["Familiarity with high school mathematics and logic"],
    resources: []
  },
  {
    id: "c-dbms",
    title: "Database Management Systems (DBMS)",
    description: "The authoritative university curriculum on Database Management Systems by Neso Academy. Learn relational data models, ER diagrams, relational algebra, SQL, functional dependencies, normalization (1NF, 2NF, 3NF, BCNF, 4NF, 5NF), transactions, concurrency control, locking, and recovery.",
    trainerId: "u-trainer-neso",
    trainerName: "Neso Academy",
    category: "Technical",
    thumbnail: "/thumbnails/dbms-course.jpg",
    duration: "28+ Hours • 91 Lessons",
    level: "Intermediate",
    status: "active",
    createdAt: "2026-03-03T10:00:00Z",
    rating: 0,
    totalRatings: 0,
    videoUrl: "https://youtube.com/playlist?list=PLBlnK6fEyqRiyryTrbKHX1Sh9luYI0dhX",
    lessons: dbmsLessons,
    tags: ["DBMS", "Relational Algebra", "SQL", "Normalization", "Concurrency Control", "Transactions"],
    syllabus: [
      "Unit 1: Introduction to DBMS, 3-Tier Architecture & Data Independence",
      "Unit 2: Entity-Relationship (ER) Modeling, Entities, Attributes & Cardinality",
      "Unit 3: Relational Model & Relational Algebra Operators",
      "Unit 4: SQL Queries, Constraints, Triggers & Views",
      "Unit 5: Functional Dependencies & Attribute Closure",
      "Unit 6: Normalization Forms: 1NF, 2NF, 3NF, BCNF, 4NF & 5NF",
      "Unit 7: Transactions, ACID Properties, Schedules & Serializability",
      "Unit 8: Concurrency Control (2PL, Timestamp Ordering, Multiversion)",
      "Unit 9: Deadlock Handling, Recovery Protocols & Log-Based Recovery"
    ],
    prerequisites: ["Basic knowledge of computer systems and discrete structures"],
    resources: []
  },
  {
    id: "c-cn",
    title: "Computer Networks (Complete Course)",
    description: "Complete university and GATE syllabus course on Computer Networks by Varun Singla (Gate Smashers). Dive deep into OSI and TCP/IP 5-layer architecture, Physical Layer, Data Link Layer (Framing, Flow Control, Error Detection, CSMA/CD), Network Layer (IP Addressing, Subnetting, CIDR, Routing Algorithms), Transport Layer (TCP, UDP, Congestion Control), and Application Layer protocols (DNS, HTTP, SMTP).",
    trainerId: "u-trainer-varun",
    trainerName: "Varun Singla (Gate Smashers)",
    category: "Technical",
    thumbnail: "/thumbnails/cn-course.jpg",
    duration: "32+ Hours • 100 Lessons",
    level: "Intermediate",
    status: "active",
    createdAt: "2026-03-03T10:00:00Z",
    rating: 0,
    totalRatings: 0,
    videoUrl: "https://youtube.com/playlist?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_",
    lessons: cnLessons,
    tags: ["Computer Networks", "TCP/IP", "OSI Model", "Subnetting", "Routing", "Gate Smashers"],
    syllabus: [
      "Chapter 1: Network Fundamentals, Topologies, OSI vs TCP/IP Protocol Suites",
      "Chapter 2: Physical Layer, Transmission Media, Switching (Packet vs Circuit)",
      "Chapter 3: Data Link Layer: Framing, Flow Control (Stop & Wait, Go-Back-N, Selective Repeat)",
      "Chapter 4: Error Detection & Correction (CRC, Hamming Code) & Multiple Access (CSMA/CD)",
      "Chapter 5: Network Layer: IPv4 Addressing, Classful vs Classless, Subnetting, VLSM & CIDR",
      "Chapter 6: Routing Protocols: Distance Vector, Link State (OSPF), BGP & NAT",
      "Chapter 7: Transport Layer: TCP 3-Way Handshake, Sliding Window, Congestion Control & UDP",
      "Chapter 8: Application Layer: DNS, DHCP, HTTP/HTTPS, FTP, SMTP & Network Security"
    ],
    prerequisites: ["Basic computer literacy and binary arithmetic"],
    resources: []
  },
  {
    id: "c-daa",
    title: "Design and Analysis of Algorithms (DAA)",
    description: "Comprehensive university and competitive exam masterclass on Algorithm Design & Analysis by Sanchit Jain (KnowledgeGATE). Covers Asymptotic Notations (Big-O, Omega, Theta), Master Theorem, Divide and Conquer, Greedy Techniques, Dynamic Programming, Backtracking, Branch & Bound, and NP-Completeness.",
    trainerId: "u-trainer-sanchit",
    trainerName: "Sanchit Jain (KnowledgeGATE)",
    category: "Technical",
    thumbnail: "/thumbnails/daa-course.jpg",
    duration: "8+ Hours • 10 Chapters",
    level: "Advanced",
    status: "active",
    createdAt: "2026-03-03T10:00:00Z",
    rating: 0,
    totalRatings: 0,
    videoUrl: "https://youtu.be/z6DY_YSdyww",
    lessons: daaLessons,
    tags: ["DAA", "Algorithms", "Complexity Analysis", "Dynamic Programming", "Greedy", "NP-Complete"],
    syllabus: [
      "Chapter 1: Introduction to Algorithms & Asymptotic Notations",
      "Chapter 2: Recurrence Relations & Master Theorem",
      "Chapter 3: Divide and Conquer (Merge Sort, Quick Sort, Binary Search)",
      "Chapter 4: Greedy Algorithms (Knapsack, Huffman Coding, Prim's, Kruskal's)",
      "Chapter 5: Dynamic Programming (LCS, Matrix Chain Multiplication, 0/1 Knapsack)",
      "Chapter 6: Backtracking & Branch and Bound (N-Queens, Graph Coloring, TSP)",
      "Chapter 7: String Matching Algorithms (KMP, Rabin-Karp)",
      "Chapter 8: NP-Hard and NP-Complete Problems"
    ],
    prerequisites: ["Data Structures (Arrays, Trees, Graphs) and C/C++ programming"],
    resources: []
  },
  {
    id: "c-se",
    title: "Software Engineering",
    description: "NPTEL & University flagship course on Software Engineering by Prof. Rajib Mall (IIT Kharagpur). Master software lifecycles (Waterfall, Spiral, Agile, Scrum), Requirements Engineering (SRS), Object-Oriented Software Design with UML diagrams, Function-Oriented Design, Coding Standards, Software Testing (Black-Box, White-Box), and Software Quality Management.",
    trainerId: "u-trainer-rajib",
    trainerName: "Prof. Rajib Mall (IIT Kharagpur)",
    category: "Technical",
    thumbnail: "/thumbnails/se-course.jpg",
    duration: "30+ Hours • 60 Lessons",
    level: "Intermediate",
    status: "active",
    createdAt: "2026-03-03T10:00:00Z",
    rating: 0,
    totalRatings: 0,
    videoUrl: "https://youtube.com/playlist?list=PLbRMhDVUMngf8oZR3DpKMvYhZKga90JVt",
    lessons: seLessons,
    tags: ["Software Engineering", "SDLC", "Agile", "UML", "Software Testing", "IIT Kharagpur"],
    syllabus: [
      "Module 1: Evolution of Software Engineering & Life Cycle Models (Waterfall, Iterative, Agile)",
      "Module 2: Software Requirements Analysis & Specification (SRS Document)",
      "Module 3: Software Project Management: Metrics, Cost Estimation (COCOMO), Risk Analysis",
      "Module 4: Software Design: Coupling, Cohesion, Function-Oriented Design (DFD)",
      "Module 5: Object-Oriented Design using UML (Use Case, Class, Sequence & State Diagrams)",
      "Module 6: Coding Guidelines, Code Review & Verification",
      "Module 7: Software Testing: Unit, Integration, Black-Box & White-Box Testing",
      "Module 8: Software Reliability, Quality Metrics (ISO 9001, SEI CMM) & Maintenance"
    ],
    prerequisites: ["Object-Oriented Programming and basic software concepts"],
    resources: []
  }
];

export const initialAssessments: Assessment[] = [
  {
    id: "a-webdev-sigma",
    courseId: "c6",
    courseTitle: "Web Development Course",
    title: "Full Stack Web Development Certification Assessment",
    description: "Proctored competency evaluation covering HTML5 semantics, CSS Flexbox/Grid, JavaScript asynchronous logic, REST APIs, and React component state.",
    deadline: "2026-12-31T23:59:59Z",
    durationMinutes: 20,
    passingScore: 40,
    createdBy: "CodeWithHarry (Haris Khan)",
    createdAt: "2026-02-15T12:00:00Z",
    questions: [
      {
        id: "q-wd-1",
        text: "Which HTML5 semantic element should be used to wrap major navigation links on a website?",
        options: [
          { id: "o1", text: "<menu-bar>" },
          { id: "o2", text: "<nav>" },
          { id: "o3", text: "<navigate>" },
          { id: "o4", text: "<links>" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-wd-1", 1),
        points: 20,
        explanation: "The <nav> element represents a section of a page whose purpose is to provide navigation links.",
        topic: "Semantic HTML5"
      },
      {
        id: "q-wd-2",
        text: "In CSS Flexbox, which property aligns flex items along the cross axis (perpendicular to the main axis)?",
        options: [
          { id: "o1", text: "justify-content" },
          { id: "o2", text: "align-items" },
          { id: "o3", text: "flex-direction" },
          { id: "o4", text: "space-between" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-wd-2", 1),
        points: 20,
        explanation: "align-items specifies the default alignment for items inside the flex container along the cross axis.",
        topic: "CSS Flexbox"
      },
      {
        id: "q-wd-3",
        text: "In modern JavaScript (ES6+), what is the primary difference between 'let' and 'var'?",
        options: [
          { id: "o1", text: "'var' is block-scoped while 'let' is function-scoped" },
          { id: "o2", text: "'let' is block-scoped while 'var' is function-scoped" },
          { id: "o3", text: "'let' cannot be reassigned" },
          { id: "o4", text: "There is no functional difference" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-wd-3", 1),
        points: 20,
        explanation: "let is block-scoped (confined to the enclosing curly braces {}), whereas var is function-scoped.",
        topic: "JavaScript ES6+"
      },
      {
        id: "q-wd-4",
        text: "What HTTP method is considered idempotent and used to retrieve representation of a resource?",
        options: [
          { id: "o1", text: "POST" },
          { id: "o2", text: "GET" },
          { id: "o3", text: "PATCH" },
          { id: "o4", text: "CONNECT" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-wd-4", 1),
        points: 20,
        explanation: "GET requests must be safe and idempotent, meaning repeated identical requests produce the same side effect.",
        topic: "REST APIs"
      },
      {
        id: "q-wd-5",
        text: "In React, why must hooks like useState and useEffect only be called at the top level of a component?",
        options: [
          { id: "o1", text: "Because JavaScript engines cannot compile functions inside loops" },
          { id: "o2", text: "To guarantee that hooks are called in the exact same order on every render" },
          { id: "o3", text: "Because React components can only have a single hook invocation" },
          { id: "o4", text: "To prevent variables from leaking into global window scope" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-wd-5", 1),
        points: 20,
        explanation: "React relies on the call order of Hooks across renders to associate local state with the corresponding Hook.",
        topic: "React State"
      }
    ]
  },
  {
    id: "a-dsa-striver",
    courseId: "c-dsa",
    courseTitle: "DATA STRUCTURE AND ALGORITHM",
    title: "Data Structures & Algorithms Mastery Certification",
    description: "Comprehensive proctored assessment testing core algorithmic principles: asymptotic analysis, binary search, dynamic programming, monotonic stacks, and graph algorithms.",
    deadline: "2026-12-31T23:59:59Z",
    durationMinutes: 30,
    passingScore: 40,
    createdBy: "Raj Vikramaditya (Striver)",
    createdAt: "2026-03-01T10:00:00Z",
    questions: [
      {
        id: "q-dsa-1",
        text: "What is the worst-case time complexity of searching for an element in a Balanced Binary Search Tree (such as AVL or Red-Black Tree)?",
        options: [
          { id: "o1", text: "O(N)" },
          { id: "o2", text: "O(log N)" },
          { id: "o3", text: "O(N log N)" },
          { id: "o4", text: "O(1)" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-dsa-1", 1),
        points: 20,
        explanation: "In a balanced BST, tree height is strictly bounded by O(log N), guaranteeing O(log N) worst-case search, insertion, and deletion.",
        topic: "Trees & BST"
      },
      {
        id: "q-dsa-2",
        text: "In Dijkstra's single-source shortest path algorithm implemented with a Min-Priority Queue, what is the overall time complexity?",
        options: [
          { id: "o1", text: "O(V^3)" },
          { id: "o2", text: "O((V + E) log V)" },
          { id: "o3", text: "O(V * E)" },
          { id: "o4", text: "O(E^2)" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-dsa-2", 1),
        points: 20,
        explanation: "Extracting min vertex takes O(V log V) and edge relaxations take O(E log V), yielding total O((V + E) log V) time.",
        topic: "Graph Algorithms"
      },
      {
        id: "q-dsa-3",
        text: "What is the space-optimized auxiliary space complexity for solving the 0/1 Knapsack problem using Dynamic Programming?",
        options: [
          { id: "o1", text: "O(1) space" },
          { id: "o2", text: "O(W) space using a single 1D array" },
          { id: "o3", text: "O(N * W) space only" },
          { id: "o4", text: "O(N^2) space" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-dsa-3", 1),
        points: 20,
        explanation: "By iterating weight from W down to item weight, we can update the DP state in a single 1D array of size O(W).",
        topic: "Dynamic Programming"
      },
      {
        id: "q-dsa-4",
        text: "Which algorithm can detect a cycle in a Directed Acyclic Graph (DAG) during topological sorting?",
        options: [
          { id: "o1", text: "Kruskal's Algorithm" },
          { id: "o2", text: "Kahn's Algorithm (BFS using in-degrees)" },
          { id: "o3", text: "Floyd-Warshall Algorithm" },
          { id: "o4", text: "Prim's Algorithm" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-dsa-4", 1),
        points: 20,
        explanation: "If Kahn's algorithm fails to include all V vertices in the topological sort order, the directed graph contains at least one cycle.",
        topic: "Graphs"
      },
      {
        id: "q-dsa-5",
        text: "What is the time complexity to find the Next Greater Element for all elements in an array of size N using a Monotonic Stack?",
        options: [
          { id: "o1", text: "O(N^2)" },
          { id: "o2", text: "O(N)" },
          { id: "o3", text: "O(log N)" },
          { id: "o4", text: "O(N log N)" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-dsa-5", 1),
        points: 20,
        explanation: "Each element is pushed and popped from the monotonic stack at most once, resulting in amortized O(N) linear time.",
        topic: "Stacks & Queues"
      }
    ]
  },
  {
    id: "a-sql-cs50",
    courseId: "c-sql",
    courseTitle: "Databases With SQL",
    title: "Databases With SQL Certification Assessment",
    description: "Proctored Harvard CS50 curriculum examination covering SQL querying, joins, schema normalization, indexing, and ACID transactions.",
    deadline: "2026-12-31T23:59:59Z",
    durationMinutes: 25,
    passingScore: 40,
    createdBy: "Carter Zenke (Harvard University)",
    createdAt: "2026-03-02T10:00:00Z",
    questions: [
      {
        id: "q-sql-1",
        text: "In SQL, which clause is specifically used to filter rows AFTER an aggregate function has grouped them?",
        options: [
          { id: "o1", text: "WHERE" },
          { id: "o2", text: "HAVING" },
          { id: "o3", text: "FILTER" },
          { id: "o4", text: "GROUP BY" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-sql-1", 1),
        points: 20,
        explanation: "WHERE filters rows before aggregation occurs; HAVING filters grouped rows after aggregation.",
        topic: "SQL Syntax"
      },
      {
        id: "q-sql-2",
        text: "Which type of SQL JOIN returns all records from the left table and matched records from the right table, filling with NULL for unmatched rows?",
        options: [
          { id: "o1", text: "INNER JOIN" },
          { id: "o2", text: "LEFT OUTER JOIN" },
          { id: "o3", text: "FULL OUTER JOIN" },
          { id: "o4", text: "CROSS JOIN" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-sql-2", 1),
        points: 20,
        explanation: "A LEFT OUTER JOIN preserves every row from the left table regardless of whether a matching record exists in the right table.",
        topic: "Relational Joins"
      },
      {
        id: "q-sql-3",
        text: "What condition is required for a relation to be in Third Normal Form (3NF)?",
        options: [
          { id: "o1", text: "It must have no composite primary keys" },
          { id: "o2", text: "It must be in 2NF and have no transitive dependencies of non-key attributes on the primary key" },
          { id: "o3", text: "It must have at least three distinct foreign keys" },
          { id: "o4", text: "All rows must be indexed in ascending chronological order" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-sql-3", 1),
        points: 20,
        explanation: "3NF requires a table to be in 2NF and every non-key column must depend directly and only on the primary key (no transitive dependencies).",
        topic: "Database Normalization"
      },
      {
        id: "q-sql-4",
        text: "What underlying data structure is commonly used by relational database management systems (RDBMS) to implement fast table indexes?",
        options: [
          { id: "o1", text: "Linked List" },
          { id: "o2", text: "B-Tree (or B+ Tree)" },
          { id: "o3", text: "Stack" },
          { id: "o4", text: "Binary Min-Heap" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-sql-4", 1),
        points: 20,
        explanation: "B-Trees (and B+ Trees) are balanced search trees optimized for block storage, allowing O(log N) searches, insertions, and range queries.",
        topic: "Query Optimization"
      },
      {
        id: "q-sql-5",
        text: "In database transaction theory, what does 'Durability' in ACID guarantee?",
        options: [
          { id: "o1", text: "Transactions are executed within 1 millisecond" },
          { id: "o2", text: "Once a transaction commits, its changes survive power loss or system crashes" },
          { id: "o3", text: "No two users can query the database at the same time" },
          { id: "o4", text: "The database will never run out of disk space" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-sql-5", 1),
        points: 20,
        explanation: "Durability guarantees that once a transaction has been committed, its effects are permanently recorded (usually via WAL/disk persistence) even in the event of a crash.",
        topic: "Transactions & ACID"
      }
    ]
  },
  {
    id: "a-c-prog",
    courseId: "c-c-prog",
    courseTitle: "C Programming Complete Course",
    title: "C Language Fundamentals & Systems Certification",
    description: "Proctored examination covering pointers, dynamic memory allocation, structs, recursion, and file input/output in C.",
    deadline: "2026-12-31T23:59:59Z",
    durationMinutes: 20,
    passingScore: 40,
    createdBy: "CodeWithHarry (Haris Khan)",
    createdAt: "2026-03-03T10:00:00Z",
    questions: [
      {
        id: "q-c-1",
        text: "In C, what is the operator used to obtain the memory address of a variable?",
        options: [
          { id: "o1", text: "*" },
          { id: "o2", text: "&" },
          { id: "o3", text: "->" },
          { id: "o4", text: "%" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-c-1", 1),
        points: 20,
        explanation: "The address-of operator '&' returns the physical memory address of its operand.",
        topic: "Pointers & Memory"
      },
      {
        id: "q-c-2",
        text: "Which standard library function dynamically allocates memory on the heap and initializes all bytes to zero?",
        options: [
          { id: "o1", text: "malloc()" },
          { id: "o2", text: "calloc()" },
          { id: "o3", text: "realloc()" },
          { id: "o4", text: "free()" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-c-2", 1),
        points: 20,
        explanation: "calloc(n, size) allocates memory for an array of elements and zeroes out all allocated bits.",
        topic: "Dynamic Memory Allocation"
      },
      {
        id: "q-c-3",
        text: "What does the dereference operator '*' do when applied to a pointer variable in C?",
        options: [
          { id: "o1", text: "Multiplies the address by 2" },
          { id: "o2", text: "Accesses the value stored at the address contained in the pointer" },
          { id: "o3", text: "Frees the memory allocated to the pointer" },
          { id: "o4", text: "Declares a new constant" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-c-3", 1),
        points: 20,
        explanation: "The indirection or dereference operator * accesses or modifies the value located at the pointer's referenced memory address.",
        topic: "Pointers"
      },
      {
        id: "q-c-4",
        text: "What is the return value of strcmp('abc', 'abc') in C?",
        options: [
          { id: "o1", text: "1" },
          { id: "o2", text: "0" },
          { id: "o3", text: "-1" },
          { id: "o4", text: "true" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-c-4", 1),
        points: 20,
        explanation: "strcmp returns 0 when both null-terminated strings are completely identical.",
        topic: "Strings"
      },
      {
        id: "q-c-5",
        text: "What happens if dynamic memory allocated with malloc() is never released using free() before program termination in long-running processes?",
        options: [
          { id: "o1", text: "Compiler error" },
          { id: "o2", text: "Memory leak" },
          { id: "o3", text: "Segmentation fault" },
          { id: "o4", text: "Stack overflow" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-c-5", 1),
        points: 20,
        explanation: "Unreleased heap memory causes memory leaks, gradually consuming available system RAM.",
        topic: "Memory Management"
      }
    ]
  },
  {
    id: "a-python-100",
    courseId: "c-python",
    courseTitle: "Python for Beginners (100 Days of Code)",
    title: "Python 100 Days of Code Mastery Assessment",
    description: "Evaluates comprehensive Python programming capabilities: list comprehensions, OOP principles, decorators, generators, and exception handling.",
    deadline: "2026-12-31T23:59:59Z",
    durationMinutes: 20,
    passingScore: 40,
    createdBy: "CodeWithHarry (Haris Khan)",
    createdAt: "2026-03-03T10:00:00Z",
    questions: [
      {
        id: "q-py-1",
        text: "In Python, which data structure is ordered, mutable, and allows duplicate elements?",
        options: [
          { id: "o1", text: "Set" },
          { id: "o2", text: "List" },
          { id: "o3", text: "Tuple" },
          { id: "o4", text: "Dictionary Keys" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-py-1", 1),
        points: 20,
        explanation: "Lists are ordered and mutable collections in Python that permit duplicate values.",
        topic: "Data Structures"
      },
      {
        id: "q-py-2",
        text: "What keyword is used inside a Python function to turn it into a generator function?",
        options: [
          { id: "o1", text: "return" },
          { id: "o2", text: "yield" },
          { id: "o3", text: "generate" },
          { id: "o4", text: "async" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-py-2", 1),
        points: 20,
        explanation: "The yield statement suspends function execution and yields a value to the caller, producing a generator iterator.",
        topic: "Generators"
      },
      {
        id: "q-py-3",
        text: "In Python OOP, what is the purpose of the '__init__' method?",
        options: [
          { id: "o1", text: "To destroy the object instance" },
          { id: "o2", text: "Constructor method to initialize attributes when an instance is created" },
          { id: "o3", text: "To define private package variables" },
          { id: "o4", text: "To import standard libraries" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-py-3", 1),
        points: 20,
        explanation: "__init__ is Python's instance initializer method automatically invoked upon object instantiation.",
        topic: "Object-Oriented Programming"
      },
      {
        id: "q-py-4",
        text: "What is a decorator in Python?",
        options: [
          { id: "o1", text: "A GUI theme library" },
          { id: "o2", text: "A design pattern that allows modifying or extending the behavior of a function or class without permanently changing its source code" },
          { id: "o3", text: "A tool for formatting code indentation" },
          { id: "o4", text: "A syntax error detector" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-py-4", 1),
        points: 20,
        explanation: "Decorators take a callable as input and return a modified wrapper callable, commonly using the @decorator syntax.",
        topic: "Decorators"
      },
      {
        id: "q-py-5",
        text: "What block in Python is guaranteed to execute regardless of whether an exception was raised in the try block?",
        options: [
          { id: "o1", text: "catch" },
          { id: "o2", text: "finally" },
          { id: "o3", text: "else" },
          { id: "o4", text: "except" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-py-5", 1),
        points: 20,
        explanation: "The finally block always runs during cleanup, regardless of normal completion or handled/unhandled exceptions.",
        topic: "Exception Handling"
      }
    ]
  },
  {
    id: "a-cpp-dsa",
    courseId: "c-cpp-dsa",
    courseTitle: "Complete C++ DSA Course",
    title: "C++ Data Structures & Algorithms Certification",
    description: "Evaluates proficiency in C++ STL (vector, map, priority_queue), recursion, linked list operations, binary trees, and backtracking.",
    deadline: "2026-12-31T23:59:59Z",
    durationMinutes: 25,
    passingScore: 40,
    createdBy: "Shradha Khapra (Apna College)",
    createdAt: "2026-03-03T10:00:00Z",
    questions: [
      {
        id: "q-cpp-1",
        text: "What is the underlying data structure of std::map in C++ Standard Template Library (STL)?",
        options: [
          { id: "o1", text: "Hash Table" },
          { id: "o2", text: "Red-Black Tree (Self-Balancing BST)" },
          { id: "o3", text: "Dynamic Array" },
          { id: "o4", text: "Min-Heap" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-cpp-1", 1),
        points: 20,
        explanation: "std::map in C++ is ordered and implemented as a Red-Black Tree providing O(log N) lookup, insertion, and deletion.",
        topic: "C++ STL"
      },
      {
        id: "q-cpp-2",
        text: "How do you pass a variable by reference in C++ to avoid expensive object copies?",
        options: [
          { id: "o1", text: "void func(Type *x)" },
          { id: "o2", text: "void func(Type &x)" },
          { id: "o3", text: "void func(Type %x)" },
          { id: "o4", text: "void func(ref Type x)" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-cpp-2", 1),
        points: 20,
        explanation: "Type &x creates a reference parameter, allowing in-place modifications without copying data.",
        topic: "C++ Syntax"
      },
      {
        id: "q-cpp-3",
        text: "What is the worst-case time complexity of QuickSort when a poor pivot (e.g. smallest or largest element) is repeatedly chosen?",
        options: [
          { id: "o1", text: "O(N log N)" },
          { id: "o2", text: "O(N^2)" },
          { id: "o3", text: "O(N)" },
          { id: "o4", text: "O(log N)" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-cpp-3", 1),
        points: 20,
        explanation: "Unbalanced partitions reduce QuickSort's recursion depth to N, yielding O(N^2) quadratic time.",
        topic: "Algorithms"
      },
      {
        id: "q-cpp-4",
        text: "In Floyd's Cycle-Finding Algorithm (Tortoise and Hare), what are the step sizes of the two pointers?",
        options: [
          { id: "o1", text: "Slow moves 2 steps, Fast moves 3 steps" },
          { id: "o2", text: "Slow moves 1 step, Fast moves 2 steps" },
          { id: "o3", text: "Slow moves 1 step, Fast moves 1 step" },
          { id: "o4", text: "Slow moves 2 steps, Fast moves 1 step" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-cpp-4", 1),
        points: 20,
        explanation: "Slow advances by 1 node while Fast advances by 2 nodes. If a cycle exists, they will collide in O(N) time.",
        topic: "Linked Lists"
      },
      {
        id: "q-cpp-5",
        text: "Which traversal of a Binary Search Tree (BST) visits nodes in strictly non-decreasing sorted numerical order?",
        options: [
          { id: "o1", text: "Pre-order" },
          { id: "o2", text: "In-order (Left, Root, Right)" },
          { id: "o3", text: "Post-order" },
          { id: "o4", text: "Level-order" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-cpp-5", 1),
        points: 20,
        explanation: "In-order traversal of a valid BST always yields elements in sorted ascending order.",
        topic: "Binary Trees"
      }
    ]
  },
  {
    id: "a-dbms-neso",
    courseId: "c-dbms",
    courseTitle: "Database Management Systems (DBMS)",
    title: "Database Management Systems Academic Certification",
    description: "Proctored academic assessment evaluating relational algebra, Boyce-Codd Normal Form (BCNF), serializability, and 2-Phase Locking (2PL).",
    deadline: "2026-12-31T23:59:59Z",
    durationMinutes: 25,
    passingScore: 40,
    createdBy: "Neso Academy",
    createdAt: "2026-03-03T10:00:00Z",
    questions: [
      {
        id: "q-dbms-1",
        text: "Which relational algebra operator selects tuples that satisfy a given predicate condition?",
        options: [
          { id: "o1", text: "Projection (Π)" },
          { id: "o2", text: "Selection (σ)" },
          { id: "o3", text: "Cartesian Product (⨯)" },
          { id: "o4", text: "Join (⨝)" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-dbms-1", 1),
        points: 20,
        explanation: "Sigma (σ) represents the selection operator in relational algebra to filter horizontal tuples matching conditions.",
        topic: "Relational Algebra"
      },
      {
        id: "q-dbms-2",
        text: "What is the requirement for a functional dependency X -> Y to satisfy Boyce-Codd Normal Form (BCNF)?",
        options: [
          { id: "o1", text: "Y must be a primary key" },
          { id: "o2", text: "X must be a superkey (or trivial dependency)" },
          { id: "o3", text: "X must be a foreign key" },
          { id: "o4", text: "The relation must contain no null values" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-dbms-2", 1),
        points: 20,
        explanation: "For every non-trivial functional dependency X -> Y in BCNF, the left-hand determinant X must be a superkey.",
        topic: "Normalization"
      },
      {
        id: "q-dbms-3",
        text: "In the Two-Phase Locking (2PL) protocol, what is guaranteed if all transactions follow strict 2PL?",
        options: [
          { id: "o1", text: "Freedom from deadlocks" },
          { id: "o2", text: "Conflict serializability and strict schedules (cascadeless)" },
          { id: "o3", text: "Zero disk I/O" },
          { id: "o4", text: "Infinite throughput" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-dbms-3", 1),
        points: 20,
        explanation: "2PL guarantees conflict serializability, and strict 2PL additionally guarantees cascadeless recoverable schedules.",
        topic: "Concurrency Control"
      },
      {
        id: "q-dbms-4",
        text: "In database recovery, what does the Write-Ahead Logging (WAL) protocol mandate?",
        options: [
          { id: "o1", text: "Log records must be written after the transaction commits" },
          { id: "o2", text: "Log records corresponding to a database modification must be flushed to stable storage before the data page is written to disk" },
          { id: "o3", text: "Logs must be stored in volatile RAM only" },
          { id: "o4", text: "Only SELECT queries generate log entries" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-dbms-4", 1),
        points: 20,
        explanation: "WAL dictates that log records describing a change must be persisted before the updated data page reaches disk.",
        topic: "Crash Recovery"
      },
      {
        id: "q-dbms-5",
        text: "What anomaly occurs when transaction T1 reads uncommitted data written by transaction T2, and T2 subsequently aborts/rolls back?",
        options: [
          { id: "o1", text: "Non-repeatable read" },
          { id: "o2", text: "Dirty read (Read-Write conflict)" },
          { id: "o3", text: "Phantom read" },
          { id: "o4", text: "Lost update" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-dbms-5", 1),
        points: 20,
        explanation: "A dirty read happens when a transaction reads uncommitted changes of another concurrent transaction that later fails.",
        topic: "Transaction Anomalies"
      }
    ]
  },
  {
    id: "a-cn-gate",
    courseId: "c-cn",
    courseTitle: "Computer Networks (Complete Course)",
    title: "Computer Networks Protocol Engineering Certification",
    description: "Proctored exam covering IPv4 subnetting, TCP flow control, Hamming codes, routing algorithms, and OSI reference model.",
    deadline: "2026-12-31T23:59:59Z",
    durationMinutes: 25,
    passingScore: 40,
    createdBy: "Varun Singla (Gate Smashers)",
    createdAt: "2026-03-03T10:00:00Z",
    questions: [
      {
        id: "q-cn-1",
        text: "In IPv4 subnetting with CIDR notation /27, how many usable host addresses are available per subnet?",
        options: [
          { id: "o1", text: "32" },
          { id: "o2", text: "30" },
          { id: "o3", text: "62" },
          { id: "o4", text: "14" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-cn-1", 1),
        points: 20,
        explanation: "A /27 prefix leaves 32 - 27 = 5 host bits. Total addresses = 2^5 = 32. Subtracting Network and Broadcast IDs gives 30 usable hosts.",
        topic: "IPv4 Subnetting"
      },
      {
        id: "q-cn-2",
        text: "In TCP, what mechanism is used to achieve reliable connection establishment between client and server?",
        options: [
          { id: "o1", text: "Single ACK packet" },
          { id: "o2", text: "Three-way handshake (SYN, SYN-ACK, ACK)" },
          { id: "o3", text: "Four-way handshake (FIN, ACK, FIN, ACK)" },
          { id: "o4", text: "UDP broadcast" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-cn-2", 1),
        points: 20,
        explanation: "TCP uses a 3-way handshake: Client sends SYN, Server replies with SYN-ACK, Client completes with ACK.",
        topic: "Transport Layer"
      },
      {
        id: "q-cn-3",
        text: "Which layer of the OSI model is directly responsible for framing, physical MAC addressing, and link-level error detection?",
        options: [
          { id: "o1", text: "Physical Layer" },
          { id: "o2", text: "Data Link Layer" },
          { id: "o3", text: "Network Layer" },
          { id: "o4", text: "Transport Layer" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-cn-3", 1),
        points: 20,
        explanation: "The Data Link Layer packages bit streams into frames and handles MAC addressing and CRC error detection.",
        topic: "OSI Model"
      },
      {
        id: "q-cn-4",
        text: "What major problem is associated with Distance Vector Routing algorithms (like RIP)?",
        options: [
          { id: "o1", text: "High memory consumption" },
          { id: "o2", text: "Count-to-Infinity problem" },
          { id: "o3", text: "Requires global link-state topology maps" },
          { id: "o4", text: "Inability to support IP routing" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-cn-4", 1),
        points: 20,
        explanation: "Distance Vector Routing suffers from the count-to-infinity issue when link failures occur, mitigated by Split Horizon and Poison Reverse.",
        topic: "Routing Algorithms"
      },
      {
        id: "q-cn-5",
        text: "Which application layer protocol automatically assigns IP addresses, default gateways, and DNS servers to client devices joining a network?",
        options: [
          { id: "o1", text: "DNS" },
          { id: "o2", text: "DHCP" },
          { id: "o3", text: "ARP" },
          { id: "o4", text: "ICMP" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-cn-5", 1),
        points: 20,
        explanation: "DHCP (Dynamic Host Configuration Protocol) automatically assigns IP configuration parameters to network clients.",
        topic: "Application Layer"
      }
    ]
  },
  {
    id: "a-daa-kg",
    courseId: "c-daa",
    courseTitle: "Design and Analysis of Algorithms (DAA)",
    title: "Algorithm Design & Complexity Analysis Certification",
    description: "Evaluates asymptotic analysis, recurrence solutions via Master Theorem, greedy proof techniques, and NP-completeness reductions.",
    deadline: "2026-12-31T23:59:59Z",
    durationMinutes: 25,
    passingScore: 40,
    createdBy: "Sanchit Jain (KnowledgeGATE)",
    createdAt: "2026-03-03T10:00:00Z",
    questions: [
      {
        id: "q-daa-1",
        text: "What is the solution of the recurrence T(n) = 2T(n/2) + O(n) according to the Master Theorem?",
        options: [
          { id: "o1", text: "O(n)" },
          { id: "o2", text: "O(n log n)" },
          { id: "o3", text: "O(n^2)" },
          { id: "o4", text: "O(log n)" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-daa-1", 1),
        points: 20,
        explanation: "With a = 2, b = 2, log_b(a) = log_2(2) = 1. Since f(n) = O(n^1), case 2 of Master Theorem applies: T(n) = O(n log n) (e.g. Merge Sort).",
        topic: "Master Theorem"
      },
      {
        id: "q-daa-2",
        text: "Which algorithmic paradigm does the Fractional Knapsack problem solve optimally in O(n log n) time?",
        options: [
          { id: "o1", text: "Dynamic Programming" },
          { id: "o2", text: "Greedy Technique (sorting by value-to-weight ratio)" },
          { id: "o3", text: "Branch and Bound" },
          { id: "o4", text: "Backtracking" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-daa-2", 1),
        points: 20,
        explanation: "Fractional Knapsack exhibits the greedy choice property: sorting items by value/weight ratio yields optimal solution.",
        topic: "Greedy Algorithms"
      },
      {
        id: "q-daa-3",
        text: "What is the time complexity to find the Longest Common Subsequence (LCS) of two strings of lengths m and n using Dynamic Programming?",
        options: [
          { id: "o1", text: "O(m + n)" },
          { id: "o2", text: "O(m * n)" },
          { id: "o3", text: "O(2^(m+n))" },
          { id: "o4", text: "O(m log n)" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-daa-3", 1),
        points: 20,
        explanation: "Constructing the 2D DP table of size (m+1) x (n+1) requires filling each cell in O(1), leading to O(m*n) time.",
        topic: "Dynamic Programming"
      },
      {
        id: "q-daa-4",
        text: "In complexity theory, what defines the complexity class NP?",
        options: [
          { id: "o1", text: "Problems solvable in non-polynomial time" },
          { id: "o2", text: "Decision problems whose solutions can be verified in polynomial time by a deterministic Turing machine" },
          { id: "o3", text: "Problems that cannot be solved by any computer" },
          { id: "o4", text: "Problems solvable in linear logarithmic time" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-daa-4", 1),
        points: 20,
        explanation: "NP denotes Non-deterministic Polynomial time: problems for which a candidate certificate can be verified in polynomial time.",
        topic: "Complexity Theory"
      },
      {
        id: "q-daa-5",
        text: "Which algorithm finds the Minimum Spanning Tree (MST) of a connected edge-weighted graph by greedily adding the smallest weight edge that doesn't form a cycle?",
        options: [
          { id: "o1", text: "Dijkstra's Algorithm" },
          { id: "o2", text: "Kruskal's Algorithm" },
          { id: "o3", text: "Bellman-Ford Algorithm" },
          { id: "o4", text: "Floyd-Warshall Algorithm" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-daa-5", 1),
        points: 20,
        explanation: "Kruskal's algorithm sorts all edges and uses a Disjoint Set Union (DSU) structure to greedily add cycle-free minimum edges.",
        topic: "Graph Algorithms"
      }
    ]
  },
  {
    id: "a-se-iit",
    courseId: "c-se",
    courseTitle: "Software Engineering",
    title: "Software Engineering & Lifecycle Architectures Certification",
    description: "Proctored academic evaluation based on Prof. Rajib Mall's IIT Kharagpur curriculum: SDLC models, SRS standards, UML modeling, cyclomatic complexity, and software testing.",
    deadline: "2026-12-31T23:59:59Z",
    durationMinutes: 25,
    passingScore: 40,
    createdBy: "Prof. Rajib Mall (IIT Kharagpur)",
    createdAt: "2026-03-03T10:00:00Z",
    questions: [
      {
        id: "q-se-1",
        text: "Which Software Development Life Cycle (SDLC) model incorporates risk analysis and mitigation at every iterative loop?",
        options: [
          { id: "o1", text: "Classical Waterfall Model" },
          { id: "o2", text: "Spiral Model (Boehm)" },
          { id: "o3", text: "V-Model" },
          { id: "o4", text: "Rapid Application Development (RAD)" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-se-1", 1),
        points: 20,
        explanation: "Barry Boehm's Spiral model is a risk-driven process model with four quadrants in every iteration, explicitly focusing on risk management.",
        topic: "SDLC Models"
      },
      {
        id: "q-se-2",
        text: "What is the formula for calculating McCabe's Cyclomatic Complexity V(G) of a program's Control Flow Graph with E edges, N nodes, and P connected components?",
        options: [
          { id: "o1", text: "V(G) = E + N - P" },
          { id: "o2", text: "V(G) = E - N + 2P" },
          { id: "o3", text: "V(G) = E * N / P" },
          { id: "o4", text: "V(G) = 2E - N + P" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-se-2", 1),
        points: 20,
        explanation: "McCabe's metric is V(G) = E - N + 2P, which also equals the number of enclosed predicate regions plus 1.",
        topic: "Software Metrics"
      },
      {
        id: "q-se-3",
        text: "In Object-Oriented software design, which design quality attribute indicates how closely elements within a single module are related to each other?",
        options: [
          { id: "o1", text: "Coupling" },
          { id: "o2", text: "Cohesion" },
          { id: "o3", text: "Inheritance" },
          { id: "o4", text: "Redundancy" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-se-3", 1),
        points: 20,
        explanation: "High Cohesion is desirable: it measures the degree to which all elements inside a component focus on a single, well-defined objective.",
        topic: "Software Design"
      },
      {
        id: "q-se-4",
        text: "Which testing technique evaluates software functionality without examining the internal source code or implementation details?",
        options: [
          { id: "o1", text: "White-Box Testing (Structural)" },
          { id: "o2", text: "Black-Box Testing (Functional / Behavioral)" },
          { id: "o3", text: "Mutation Testing" },
          { id: "o4", text: "Basis Path Testing" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-se-4", 1),
        points: 20,
        explanation: "Black-Box testing focuses purely on inputs and expected outputs according to specifications, without knowledge of internal logic.",
        topic: "Software Testing"
      },
      {
        id: "q-se-5",
        text: "In UML (Unified Modeling Language), which diagram models dynamic interaction between objects sequentially over time?",
        options: [
          { id: "o1", text: "Class Diagram" },
          { id: "o2", text: "Sequence Diagram" },
          { id: "o3", text: "Component Diagram" },
          { id: "o4", text: "Deployment Diagram" }
        ],
        correctIndex: 1,
        answerHash: generateAnswerHash("q-se-5", 1),
        points: 20,
        explanation: "Sequence diagrams capture object lifelines, activation bars, and chronological message exchanges.",
        topic: "UML Modeling"
      }
    ]
  }
];

export const initialLiveSessions: LiveSession[] = [];

export const initialCompetencyMatrix: SubjectCompetency[] = [
  {
    subject: "Distributed Cloud Systems & Kubernetes",
    category: "Technical",
    organizationalDemandScore: 95,
    internalCapacityScore: 82,
    gapScore: 13,
    priority: "High",
    suitableTrainers: [
      { id: "u-trainer-official", name: "Raj Tiwari", rating: 4.98, matchPercentage: 98, experienceYears: 10, competencies: ["Kubernetes", "Microservices", "Kafka", "Cloud Architecture"] }
    ]
  },
  {
    subject: "Enterprise Generative AI & Vector Architectures",
    category: "AI & Data",
    organizationalDemandScore: 98,
    internalCapacityScore: 68,
    gapScore: 30,
    priority: "Critical",
    suitableTrainers: [
      { id: "u-trainer-official", name: "Raj Tiwari", rating: 4.98, matchPercentage: 96, experienceYears: 10, competencies: ["RAG Systems", "Vector DBs", "LLM Evaluation", "Agentic Frameworks"] },
      { id: "u-trainer-codewithharry", name: "CodeWithHarry (Haris Khan)", rating: 4.98, matchPercentage: 95, experienceYears: 12, competencies: ["AI Integrations", "Python", "Full-Stack AI", "APIs"] }
    ]
  },
  {
    subject: "Zero-Trust Cybersecurity & Compliance (ISO 27001)",
    category: "Compliance",
    organizationalDemandScore: 90,
    internalCapacityScore: 88,
    gapScore: 2,
    priority: "Medium",
    suitableTrainers: [
      { id: "u-trainer-varun", name: "Varun Singla", rating: 4.99, matchPercentage: 99, experienceYears: 11, competencies: ["Network Security", "Protocols", "Threat Modeling", "Cryptography"] }
    ]
  },
  {
    subject: "Agile Leadership & Cross-Functional Team Coaching",
    category: "Leadership",
    organizationalDemandScore: 85,
    internalCapacityScore: 80,
    gapScore: 5,
    priority: "Medium",
    suitableTrainers: [
      { id: "u-trainer-rajib", name: "Prof. Rajib Mall", rating: 4.98, matchPercentage: 98, experienceYears: 30, competencies: ["Agile Lifecycle", "Executive Engineering", "Conflict Resolution", "Project Estimation"] }
    ]
  },
  {
    subject: "Web Development Course",
    category: "Technical",
    organizationalDemandScore: 98,
    internalCapacityScore: 95,
    gapScore: 3,
    priority: "High",
    suitableTrainers: [
      { id: "u-trainer-codewithharry", name: "CodeWithHarry (Haris Khan)", rating: 4.98, matchPercentage: 100, experienceYears: 12, competencies: ["Full-Stack", "JavaScript", "React", "Next.js", "Express", "Node.js", "Tailwind"] },
      { id: "u-trainer-official", name: "Raj Tiwari", rating: 4.98, matchPercentage: 96, experienceYears: 10, competencies: ["Full-Stack", "JavaScript", "React", "Node.js", "Cloud Systems"] }
    ]
  },
  {
    subject: "DATA STRUCTURE AND ALGORITHM",
    category: "Technical",
    organizationalDemandScore: 99,
    internalCapacityScore: 96,
    gapScore: 3,
    priority: "Critical",
    suitableTrainers: [
      { id: "u-trainer-striver", name: "Raj Vikramaditya (Striver)", rating: 4.99, matchPercentage: 100, experienceYears: 10, competencies: ["DSA", "LeetCode", "Dynamic Programming", "Graphs", "Binary Search", "Trees"] }
    ]
  },
  {
    subject: "Databases With SQL",
    category: "Technical",
    organizationalDemandScore: 98,
    internalCapacityScore: 94,
    gapScore: 4,
    priority: "High",
    suitableTrainers: [
      { id: "u-trainer-carter", name: "Carter Zenke (Harvard University)", rating: 4.99, matchPercentage: 100, experienceYears: 7, competencies: ["Relational Databases", "SQL", "Database Design", "PostgreSQL", "SQLite", "Indexing"] }
    ]
  },
  {
    subject: "C Programming Language & Systems",
    category: "Technical",
    organizationalDemandScore: 96,
    internalCapacityScore: 92,
    gapScore: 4,
    priority: "High",
    suitableTrainers: [
      { id: "u-trainer-codewithharry", name: "CodeWithHarry (Haris Khan)", rating: 4.98, matchPercentage: 100, experienceYears: 10, competencies: ["C Programming", "Pointers", "Memory Management", "Data Structures"] }
    ]
  },
  {
    subject: "Python Programming & Automation",
    category: "Technical",
    organizationalDemandScore: 99,
    internalCapacityScore: 95,
    gapScore: 4,
    priority: "Critical",
    suitableTrainers: [
      { id: "u-trainer-codewithharry", name: "CodeWithHarry (Haris Khan)", rating: 4.99, matchPercentage: 100, experienceYears: 10, competencies: ["Python", "Automation", "OOP", "Data Structures", "APIs"] }
    ]
  },
  {
    subject: "Data Structures & Algorithms in C++",
    category: "Technical",
    organizationalDemandScore: 99,
    internalCapacityScore: 94,
    gapScore: 5,
    priority: "Critical",
    suitableTrainers: [
      { id: "u-trainer-shradha", name: "Shradha Khapra (Apna College)", rating: 4.98, matchPercentage: 100, experienceYears: 6, competencies: ["C++", "DSA", "STL", "Trees", "Graphs", "DP"] }
    ]
  },
  {
    subject: "Database Management Systems (DBMS)",
    category: "Technical",
    organizationalDemandScore: 97,
    internalCapacityScore: 93,
    gapScore: 4,
    priority: "High",
    suitableTrainers: [
      { id: "u-trainer-neso", name: "Neso Academy", rating: 4.97, matchPercentage: 100, experienceYears: 12, competencies: ["Relational Algebra", "Normalization", "Concurrency Control", "2PL", "WAL"] }
    ]
  },
  {
    subject: "Computer Networks & Protocols",
    category: "Technical",
    organizationalDemandScore: 98,
    internalCapacityScore: 91,
    gapScore: 7,
    priority: "High",
    suitableTrainers: [
      { id: "u-trainer-varun", name: "Varun Singla (Gate Smashers)", rating: 4.99, matchPercentage: 100, experienceYears: 11, competencies: ["OSI Model", "TCP/IP", "Subnetting", "Routing", "Flow Control"] }
    ]
  },
  {
    subject: "Design and Analysis of Algorithms (DAA)",
    category: "Technical",
    organizationalDemandScore: 98,
    internalCapacityScore: 90,
    gapScore: 8,
    priority: "Critical",
    suitableTrainers: [
      { id: "u-trainer-sanchit", name: "Sanchit Jain (KnowledgeGATE)", rating: 4.96, matchPercentage: 100, experienceYears: 10, competencies: ["Asymptotic Analysis", "Master Theorem", "DP", "Greedy", "NP-Completeness"] }
    ]
  },
  {
    subject: "Software Engineering & Lifecycle Architectures",
    category: "Technical",
    organizationalDemandScore: 96,
    internalCapacityScore: 92,
    gapScore: 4,
    priority: "High",
    suitableTrainers: [
      { id: "u-trainer-rajib", name: "Prof. Rajib Mall (IIT Kharagpur)", rating: 4.98, matchPercentage: 100, experienceYears: 30, competencies: ["SDLC", "Agile", "UML", "Software Testing", "Metrics"] }
    ]
  }
];

export const initialDiscussions: DiscussionThread[] = [
  {
    id: "disc-01",
    courseId: "c6",
    title: "Best practice for managing dependencies in useEffect without infinite re-renders?",
    content: "When fetching user profile data inside useEffect with an object state, what is the cleanest pattern to prevent unnecessary re-fetches?",
    authorId: "u-trainee-official",
    authorName: "Madhav Kumar",
    authorRole: "trainee",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-02-18T11:20:00Z",
    upvotes: 14,
    upvotedBy: ["u-trainee-2", "u-trainee-3"],
    replies: [
      {
        id: "rep-01",
        authorId: "u-trainer-codewithharry",
        authorName: "CodeWithHarry (Haris Khan)",
        authorRole: "trainer",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        content: "Great question! Either use primitive values (like user.id) directly in the dependency array instead of the entire object, or wrap the fetch function in useCallback. As covered in Tutorial #108 and #118!",
        createdAt: "2026-02-18T13:45:00Z",
        isTrainerVerified: true
      },
      {
        id: "rep-02",
        authorId: "u-trainee-official",
        authorName: "Madhav Kumar",
        authorRole: "trainee",
        content: "Passing just user.id solved the infinite loop right away, thank you Harry sir!",
        createdAt: "2026-02-18T15:10:00Z"
      }
    ]
  },
  {
    id: "disc-02",
    courseId: "c6",
    title: "When to choose CSS Grid over Flexbox in responsive card layouts?",
    content: "For a responsive dashboard gallery, is CSS Grid with repeat(auto-fit, minmax(...)) better than Flexbox flex-wrap?",
    authorId: "u-trainee-official",
    authorName: "Madhav Kumar",
    authorRole: "trainee",
    createdAt: "2026-02-22T09:15:00Z",
    upvotes: 8,
    upvotedBy: ["u-trainee-official"],
    replies: [
      {
        id: "rep-03",
        authorId: "u-trainer-codewithharry",
        authorName: "CodeWithHarry (Haris Khan)",
        authorRole: "trainer",
        content: "CSS Grid is 2D and excels when you want uniform column alignments across rows. Flexbox is 1D and best for header bars or uneven tag strips. In Tutorial #44 we cover exactly this comparison!",
        createdAt: "2026-02-22T10:30:00Z",
        isTrainerVerified: true
      }
    ]
  },
  {
    id: "disc-dsa-01",
    courseId: "c-dsa",
    title: "How to identify if a problem should be solved with Monotonic Stack?",
    content: "Whenever a problem asks for Next Greater Element or Previous Smaller Element, is Monotonic Stack always the optimal O(N) choice?",
    authorId: "u-trainee-official",
    authorName: "Madhav Kumar",
    authorRole: "trainee",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-03-02T10:00:00Z",
    upvotes: 19,
    upvotedBy: ["u-trainee-official"],
    replies: [
      {
        id: "rep-dsa-01",
        authorId: "u-trainer-striver",
        authorName: "Raj Vikramaditya (Striver)",
        authorRole: "trainer",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        content: "Yes! Whenever you need the nearest greater/smaller element on the left or right, a monotonic stack maintains elements in sorted order and guarantees each index is pushed and popped at most once in O(N). Check video #300 and the Stack series!",
        createdAt: "2026-03-02T11:15:00Z",
        isTrainerVerified: true
      }
    ]
  },
  {
    id: "disc-sql-01",
    courseId: "c-sql",
    title: "When should we prefer B-Tree Index over Hash Index in PostgreSQL?",
    content: "Is a B-Tree index always the default recommendation, or does a Hash index perform better for exact equality lookups?",
    authorId: "u-trainee-official",
    authorName: "Madhav Kumar",
    authorRole: "trainee",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-03-02T12:00:00Z",
    upvotes: 24,
    upvotedBy: ["u-trainee-official"],
    replies: [
      {
        id: "rep-sql-01",
        authorId: "u-trainer-carter",
        authorName: "Carter Zenke",
        authorRole: "trainer",
        authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        content: "B-Tree is the universal default because it supports equality (=), range comparisons (<, <=, >, >=), BETWEEN, and ORDER BY sorting. Hash indexes in PostgreSQL only support simple equality (=) lookups and cannot optimize range queries or sorting.",
        createdAt: "2026-03-02T13:30:00Z",
        isTrainerVerified: true
      }
    ]
  }
];

export const initialFeedbacks: Feedback[] = [];

export const initialNotifications: Notification[] = [
  {
    id: "n-ann-1",
    type: "announcement",
    title: "Official Announcement: Annual Capacity Building & Technical Upskilling Calendar 2026",
    content: "The Ministry & Directorate has ratified the 2026 Competency Development Schedule. All engineers, faculty, and technical trainees are requested to review designated subject roadmaps and upcoming live masterclasses.",
    createdAt: "2026-09-06T12:00:00Z",
    pinned: true,
    author: "Directorate of Training & Capacity Building"
  },
  {
    id: "n-ach-1",
    type: "achievement",
    title: "Milestone Achieved: 1,500+ Engineers & Trainees Certified",
    content: "CAPACITY CONNECT has successfully crossed 1,500 certified trainees across Full-Stack Web Development, Data Structures, Python Automation, and Systems Architecture with an exceptional 94.2% competency retention index.",
    createdAt: "2026-09-06T11:15:00Z",
    pinned: true,
    author: "Academic Council & Assessment Cell"
  },
  {
    id: "n1",
    type: "new_content",
    title: "New Course Uploaded: Web Development Course (Full Stack)",
    content: "CodeWithHarry (Haris Khan) has published the complete Web Development Course with 139 interactive video lessons, projects, and exercises.",
    createdAt: "2026-09-06T10:00:00Z",
    pinned: true,
    author: "CodeWithHarry (Haris Khan)"
  },
  {
    id: "n2",
    type: "new_content",
    title: "New Course Uploaded: Complete C Programming",
    content: "CodeWithHarry (Haris Khan) uploaded a comprehensive 73-lesson C programming masterclass covering pointers, memory structures, and file operations.",
    createdAt: "2026-09-06T09:30:00Z",
    pinned: true,
    author: "CodeWithHarry (Haris Khan)"
  },
  {
    id: "n3",
    type: "new_content",
    title: "New Course Uploaded: Python for Automation & Systems",
    content: "CodeWithHarry (Haris Khan) uploaded the 100 Days of Python curriculum complete with modular exercises and proctored assessments.",
    createdAt: "2026-09-06T09:00:00Z",
    pinned: true,
    author: "CodeWithHarry (Haris Khan)"
  },
  {
    id: "n-ach-2",
    type: "achievement",
    title: "National Recognition: Excellence in Digital Training Infrastructure",
    content: "Capacity Connect awarded top honors for high-fidelity interactive training delivery, zero-latency Google Meet integration, and cryptographic credential issuance.",
    createdAt: "2026-09-05T16:00:00Z",
    pinned: false,
    author: "National Capacity Building Commission"
  }
];

export const initialAuditLogs: AuditLog[] = [];

export function initializeStorage() {
  // 100% Cloud-driven: local storage seeding disabled
}

export const STORAGE_KEYS = {
  AUTH: "cc_auth",
  USERS: "cc_users",
  COURSES: "cc_courses",
  ENROLLMENTS: "cc_enrollments",
  CERTIFICATES: "cc_certificates",
  ASSESSMENTS: "cc_assessments",
  ATTEMPTS: "cc_attempts",
  FEEDBACKS: "cc_feedbacks",
  NOTIFICATIONS: "cc_notifications",
  LIVE_SESSIONS: "cc_live_sessions",
  COMPETENCIES: "cc_competencies",
  DISCUSSIONS: "cc_discussions",
  LEADERBOARD: "cc_leaderboard",
  BADGES: "cc_badges",
  AUDIT_LOGS: "cc_audit_logs",
  SESSION_ATTENDANCE: "cc_session_attendance",
  LESSON_ATTENDANCE: "cc_lesson_attendance",
  DELETED_COURSES: "cc_deleted_courses",
  REMOVED_USERS: "cc_removed_users"
};

export function getFromStorage<T>(_key: string): T[] {
  // 100% Cloud-driven: data is fetched directly from Supabase Cloud
  return [];
}

export function saveToStorage<T>(_key: string, _data: T[]): void {
  // 100% Cloud-driven: local storage writes disabled
}

export function generateId(prefix: string = "id"): string {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 5);
}
