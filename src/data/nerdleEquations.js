// Nerdle equations - must be exactly 8 characters and mathematically correct
// Format: expression = result (total 8 chars including =)

const equations = [
  // Easy (single operations)
  "10+20=30",
  "15+25=40",
  "20+30=50",
  "25+35=60",
  "30+40=70",
  "35+45=80",
  "40+50=90",
  "12+34=46",
  "23+45=68",
  "34+56=90",
  "11+22=33",
  "22+33=55",
  "33+44=77",
  "44+55=99",
  "50-20=30",
  "60-25=35",
  "70-30=40",
  "80-35=45",
  "90-40=50",
  "45-15=30",
  "55-25=30",
  "65-35=30",
  "75-45=30",
  "85-55=30",
  "10*5=050",
  "12*4=048",
  "15*3=045",
  "20*4=080",
  "25*3=075",
  "11*7=077",
  "12*8=096",
  "13*6=078",
  "14*5=070",
  "15*6=090",
  "48/6=008",
  "54/6=009",
  "63/7=009",
  "72/8=009",
  "81/9=009",
  "56/7=008",
  "64/8=008",
  "49/7=007",
  "36/6=006",
  "42/7=006",

  // Medium (two operations)
  "1+2+3=6",
  "2+3+4=9",
  "3+4+5=12",
  "4+5+6=15",
  "5+6+7=18",
  "6+7+8=21",
  "7+8+9=24",
  "8+9+10=27",
  "1*2*3=6",
  "2*2*3=12",
  "3*3*2=18",
  "2*3*4=24",
  "2*3*5=30",
  "2*4*5=40",
  "3*3*5=45",
  "2*5*5=50",
  "10+5-3=12",
  "20+8-3=25",
  "15-3+8=20",
  "25-5+10=30",
  "30-10+5=25",
  "12+8-5=15",
  "18-6+3=15",
  "24-9+5=20",
  "6*3-8=10",
  "7*4-3=25",
  "8*5-5=35",
  "9*4-6=30",
  "4*8-2=30",
  "5*9-5=40",
  "6*7-2=40",
  "5*5+5=30",
  "4*6+6=30",
  "3*7+9=30",
  "8*3+6=30",
  "10/2+5=10",
  "20/4+5=10",
  "18/3+4=10",
  "24/4+4=10",
  "30/5+4=10",

  // Harder
  "9-8+7=8",
  "8-7+6=7",
  "7-6+5=6",
  "6-5+4=5",
  "5-4+3=4",
  "9+8-9=8",
  "8+7-8=7",
  "7+6-7=6",
  "12/3*2=8",
  "15/3*2=10",
  "18/3*2=12",
  "20/4*3=15",
  "24/4*3=18",
  "28/4*3=21",
  "2*9-9=9",
  "3*6-9=9",
  "4*5-11=9",
  "5*4-11=9",
  "3*8-15=9",
  "99-90=9",
  "88-79=9",
  "77-68=9",
  "66-57=9",
  "55-46=9",
];

/**
 * Get a random equation
 */
export function getRandomEquation() {
  return equations[Math.floor(Math.random() * equations.length)];
}

/**
 * Get multiple unique random equations
 */
export function getRandomEquations(count) {
  const shuffled = [...equations].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Validate if an equation is correct format and mathematically valid
 */
export function validateEquation(equation) {
  if (equation.length !== 8) {
    return { valid: false, error: 'Må være 8 tegn' };
  }

  const equalCount = (equation.match(/=/g) || []).length;
  if (equalCount !== 1) {
    return { valid: false, error: 'Må ha nøyaktig ett =' };
  }

  const validChars = /^[0-9+\-*/=]+$/;
  if (!validChars.test(equation)) {
    return { valid: false, error: 'Kun tall og +, -, *, / er tillatt' };
  }

  const [left, right] = equation.split('=');

  try {
    const leftResult = eval(left);
    const rightResult = parseInt(right, 10);

    if (isNaN(leftResult) || isNaN(rightResult)) {
      return { valid: false, error: 'Ugyldig matematikk' };
    }

    if (leftResult !== rightResult) {
      return { valid: false, error: `${left} = ${leftResult}, ikke ${right}` };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: 'Ugyldig regnestykke' };
  }
}

export default equations;
