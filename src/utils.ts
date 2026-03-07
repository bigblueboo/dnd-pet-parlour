export const rollDice = (sides: number) => Math.floor(Math.random() * sides) + 1;
export const getModifier = (stat: number) => Math.floor((stat - 10) / 2);
export const calculateMaxHp = (con: number, level: number) => {
  const conMod = getModifier(con);
  return 8 + conMod + (level - 1) * (5 + conMod); // Assuming d8 hit dice for monsters generally
};
export const generateId = () => Math.random().toString(36).substr(2, 9);
