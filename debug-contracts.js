// Debug script to check contract data
const { contractsData } = require('./src/data/contracts.ts');

console.log('=== CONTRACTS DEBUG ===');
console.log('Total contracts:', contractsData.length);

contractsData.forEach((contract, index) => {
  console.log(`${index + 1}. ID: "${contract.id}" (type: ${typeof contract.id}) - Contract: ${contract.contractNumber}`);
});

// Test specific lookups
const testIds = ['1', '2', '3', '4', '5'];
console.log('\n=== LOOKUP TESTS ===');
testIds.forEach(id => {
  const found = contractsData.find(contract => String(contract.id) === String(id));
  console.log(`ID "${id}":`, found ? found.contractNumber : 'NOT FOUND');
});