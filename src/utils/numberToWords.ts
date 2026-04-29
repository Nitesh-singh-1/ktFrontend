export function numberToWords(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanThousand(num: number): string {
    if (num === 0) return "";
    
    let result = "";
    
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + " ";
      return result;
    }
    
    if (num > 0) {
      result += ones[num] + " ";
    }
    
    return result;
  }

  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const remainder = Math.floor(amount % 1000);
  const paise = Math.round((amount % 1) * 100);

  let words = "";

  if (crore > 0) {
    words += convertLessThanThousand(crore) + "Crore ";
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + "Lakh ";
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + "Thousand ";
  }
  if (remainder > 0) {
    words += convertLessThanThousand(remainder);
  }

  words = words.trim();
  
  if (words) {
    words += " Rupees";
  }
  
  if (paise > 0) {
    words += " and " + convertLessThanThousand(paise) + "Paise";
  }
  
  words += " Only";
  
  return words;
}
