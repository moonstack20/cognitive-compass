import type { Syllabus, Blueprint, Question, CourseOutcome, ProgramOutcome } from '@/types';

export const SAMPLE_SYLLABUS_TEXT = `Unit 1: Introduction to Data Structures
- Arrays and Linked Lists
- Stacks and Queues
- Time and Space Complexity Basics

Unit 2: Searching and Sorting Algorithms
- Linear Search and Binary Search
- Bubble Sort and Selection Sort
- Merge Sort and Quick Sort
- Heap Sort

Unit 3: Trees and Graphs
- Binary Trees and BST
- Tree Traversals (Inorder, Preorder, Postorder)
- Graph Representation (Adjacency Matrix, List)
- BFS and DFS

Unit 4: Hashing and Advanced Structures
- Hash Tables and Collision Resolution
- Priority Queues
- Disjoint Set Union
- Tries

Unit 5: Algorithm Design Techniques
- Greedy Algorithms
- Dynamic Programming
- Divide and Conquer
- Backtracking`;

export const SAMPLE_UNITS = [
  {
    name: 'Unit 1: Introduction to Data Structures',
    topics: ['Arrays and Linked Lists', 'Stacks and Queues', 'Time and Space Complexity Basics'],
    weightage: 15,
  },
  {
    name: 'Unit 2: Searching and Sorting Algorithms',
    topics: ['Linear Search and Binary Search', 'Bubble Sort and Selection Sort', 'Merge Sort and Quick Sort', 'Heap Sort'],
    weightage: 25,
  },
  {
    name: 'Unit 3: Trees and Graphs',
    topics: ['Binary Trees and BST', 'Tree Traversals', 'Graph Representation', 'BFS and DFS'],
    weightage: 25,
  },
  {
    name: 'Unit 4: Hashing and Advanced Structures',
    topics: ['Hash Tables and Collision Resolution', 'Priority Queues', 'Disjoint Set Union', 'Tries'],
    weightage: 20,
  },
  {
    name: 'Unit 5: Algorithm Design Techniques',
    topics: ['Greedy Algorithms', 'Dynamic Programming', 'Divide and Conquer', 'Backtracking'],
    weightage: 15,
  },
];

export const SAMPLE_COS: Omit<CourseOutcome, 'id' | 'course_id' | 'created_at'>[] = [
  { code: 'CO1', description: 'Understand fundamental data structures and their operations' },
  { code: 'CO2', description: 'Apply searching and sorting algorithms to solve problems' },
  { code: 'CO3', description: 'Analyze tree and graph algorithms for various applications' },
  { code: 'CO4', description: 'Evaluate and design efficient algorithms using advanced techniques' },
];

export const SAMPLE_POS: Omit<ProgramOutcome, 'id' | 'course_id' | 'created_at'>[] = [
  { code: 'PO1', description: 'Engineering Knowledge: Apply knowledge of mathematics and computing fundamentals' },
  { code: 'PO2', description: 'Problem Analysis: Identify and analyze complex computing problems' },
  { code: 'PO3', description: 'Design/Development: Design solutions for computing problems' },
  { code: 'PO4', description: 'Conduct Investigations: Analyze and interpret data to deliver solutions' },
];

export const DEFAULT_BLUEPRINT = {
  bloom_distribution: {
    Remember: 10,
    Understand: 20,
    Apply: 30,
    Analyze: 25,
    Evaluate: 10,
    Create: 5,
  },
  difficulty_distribution: {
    Easy: 20,
    Medium: 50,
    Hard: 30,
  },
  num_questions: 10,
};

export const SAMPLE_QUESTIONS_TEXT = `Data Structures and Algorithms
Mid Semester Examination
Max Marks: 50  Duration: 3 Hours

Section A (10 Marks)

Q1. Define a stack data structure. List its basic operations. (5 marks)
Q2. Explain the concept of a linked list. Describe its types. (5 marks)

Section B (20 Marks)

Q3. Explain merge sort with an example. Analyze its time complexity. (10 marks)
Q4. Compare bubble sort and selection sort. Which is better? (10 marks)

Section C (20 Marks)

Q5. What is a binary search tree? Explain insertion and deletion. (10 marks)
Q6. Explain BFS and DFS with examples. (10 marks)`;
