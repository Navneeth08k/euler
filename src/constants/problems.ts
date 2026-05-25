import { Problem } from '../types';

export const PROBLEMS: Problem[] = [
  // Algebra — Factoring
  {
    id: 'alg-factor-1',
    subject: 'algebra',
    concept: 'Factoring quadratics',
    text: 'Factor completely: x² + 5x + 6',
    difficulty: 1,
  },
  {
    id: 'alg-factor-2',
    subject: 'algebra',
    concept: 'Factoring quadratics',
    text: 'Factor completely: 2x² - 7x + 3',
    difficulty: 2,
  },
  {
    id: 'alg-factor-3',
    subject: 'algebra',
    concept: 'Difference of squares',
    text: 'Factor completely: 4x² - 25',
    difficulty: 1,
  },

  // Algebra — Quadratic equations
  {
    id: 'alg-quad-1',
    subject: 'algebra',
    concept: 'Quadratic formula',
    text: 'Solve for x: x² - 4x + 1 = 0',
    difficulty: 2,
  },
  {
    id: 'alg-quad-2',
    subject: 'algebra',
    concept: 'Completing the square',
    text: 'Solve by completing the square: x² + 6x - 7 = 0',
    difficulty: 2,
  },
  {
    id: 'alg-quad-3',
    subject: 'algebra',
    concept: 'Quadratic formula',
    text: 'Solve for x: 3x² + 2x - 5 = 0',
    difficulty: 2,
  },

  // Algebra — Systems of equations
  {
    id: 'alg-sys-1',
    subject: 'algebra',
    concept: 'Systems of linear equations',
    text: 'Solve the system:\n2x + y = 7\nx - y = 2',
    difficulty: 1,
  },
  {
    id: 'alg-sys-2',
    subject: 'algebra',
    concept: 'Systems of linear equations',
    text: 'Solve the system:\n3x + 2y = 12\nx - 4y = -1',
    difficulty: 2,
  },
  {
    id: 'alg-sys-3',
    subject: 'algebra',
    concept: 'Systems of equations (substitution)',
    text: 'Solve the system:\ny = x² - 3\ny = 2x + 1',
    difficulty: 3,
  },

  // Algebra — Misc
  {
    id: 'alg-exp-1',
    subject: 'algebra',
    concept: 'Exponent rules',
    text: 'Simplify: (2x³y²)³ / (4x²y)',
    difficulty: 2,
  },

  // Calculus — Derivatives
  {
    id: 'calc-prod-1',
    subject: 'calculus',
    concept: 'Product rule',
    text: 'Find dy/dx: y = x² · sin(x)',
    difficulty: 2,
  },
  {
    id: 'calc-prod-2',
    subject: 'calculus',
    concept: 'Product rule',
    text: 'Find dy/dx: y = eˣ · ln(x)',
    difficulty: 2,
  },
  {
    id: 'calc-chain-1',
    subject: 'calculus',
    concept: 'Chain rule',
    text: 'Find dy/dx: y = sin(3x² + 1)',
    difficulty: 2,
  },
  {
    id: 'calc-chain-2',
    subject: 'calculus',
    concept: 'Chain rule',
    text: 'Find dy/dx: y = (2x - 5)⁴',
    difficulty: 1,
  },
  {
    id: 'calc-chain-3',
    subject: 'calculus',
    concept: 'Chain rule',
    text: 'Find dy/dx: y = e^(x² - 3x)',
    difficulty: 2,
  },

  // Calculus — Integration
  {
    id: 'calc-int-1',
    subject: 'calculus',
    concept: 'Integration by parts',
    text: 'Evaluate: ∫ x·eˣ dx',
    difficulty: 2,
  },
  {
    id: 'calc-int-2',
    subject: 'calculus',
    concept: 'U-substitution',
    text: 'Evaluate: ∫ 2x·cos(x²) dx',
    difficulty: 2,
  },
  {
    id: 'calc-int-3',
    subject: 'calculus',
    concept: 'Integration by parts',
    text: 'Evaluate: ∫ x²·ln(x) dx',
    difficulty: 3,
  },

  // Calculus — Limits
  {
    id: 'calc-lim-1',
    subject: 'calculus',
    concept: 'Limits',
    text: 'Evaluate: lim(x→0) sin(x)/x',
    difficulty: 1,
  },
  {
    id: 'calc-lim-2',
    subject: 'calculus',
    concept: "L'Hôpital's rule",
    text: 'Evaluate: lim(x→∞) (3x² + 2x)/(5x² - 1)',
    difficulty: 2,
  },
  {
    id: 'calc-lim-3',
    subject: 'calculus',
    concept: "L'Hôpital's rule",
    text: 'Evaluate: lim(x→0) (eˣ - 1 - x)/x²',
    difficulty: 3,
  },

  // Geometry — Area
  {
    id: 'geo-area-1',
    subject: 'geometry',
    concept: 'Area of composite shapes',
    text: 'Find the area of a region bounded by a semicircle of radius 5 on top of a rectangle with width 10 and height 4.',
    difficulty: 1,
  },
  {
    id: 'geo-area-2',
    subject: 'geometry',
    concept: 'Area using coordinates',
    text: 'Find the area of the triangle with vertices A(1,2), B(4,6), C(7,1).',
    difficulty: 2,
  },

  // Geometry — Trig identities
  {
    id: 'geo-trig-1',
    subject: 'geometry',
    concept: 'Trigonometric identities',
    text: 'Prove that: sin²(θ) + cos²(θ) = 1 starting from the unit circle definition.',
    difficulty: 1,
  },
  {
    id: 'geo-trig-2',
    subject: 'geometry',
    concept: 'Double angle formulas',
    text: 'Simplify: cos(2θ) + 2sin²(θ)',
    difficulty: 2,
  },
  {
    id: 'geo-trig-3',
    subject: 'geometry',
    concept: 'Trigonometric equations',
    text: 'Solve for θ in [0, 2π): 2sin²(θ) - sin(θ) - 1 = 0',
    difficulty: 2,
  },

  // Geometry — Proofs
  {
    id: 'geo-proof-1',
    subject: 'geometry',
    concept: 'Triangle congruence',
    text: 'In triangle ABC, D is the midpoint of BC. If AD ⊥ BC, prove that triangle ABC is isosceles.',
    difficulty: 2,
  },
  {
    id: 'geo-proof-2',
    subject: 'geometry',
    concept: 'Circle theorems',
    text: 'A tangent and a secant are drawn from an external point. The tangent is 8 cm and the external segment of the secant is 4 cm. Find the length of the secant.',
    difficulty: 3,
  },

  // Calculus — Quotient rule
  {
    id: 'calc-quot-1',
    subject: 'calculus',
    concept: 'Quotient rule',
    text: 'Find dy/dx: y = sin(x) / (x² + 1)',
    difficulty: 2,
  },
];
