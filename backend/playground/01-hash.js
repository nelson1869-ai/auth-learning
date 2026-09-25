import argon2 from 'argon2';

const hash = await argon2.hash('password123');
console.log(hash);

console.log(await argon2.verify(hash, 'password123')); // tamang password
console.log(await argon2.verify(hash, 'mali'));        // maling password
