#include <stdio.h>
#include <gmp.h>
#include <openssl/rand.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Function prototypes
void primegen(mpz_t result);
int miller_rabin(mpz_t n);
void mod_exp(mpz_t result, mpz_t base, mpz_t exp, mpz_t mod);

int main() {
    mpz_t n, d, e;

    // Initialize variables
    mpz_init(n);
    mpz_init(d);
    mpz_init(e);
    mpz_set_ui(e, 65537); // Set e = 65537 (common public exponent)


    // Initialize prime variables
    mpz_t p1, p2, phi, temp1, temp2;
    mpz_init(p1);
    mpz_init(p2);
    mpz_init(phi);
    mpz_init(temp1);
    mpz_init(temp2);

    // Generate two random large primes
    primegen(p1);
    primegen(p2);

    // Compute modulus n = p1 * p2
    mpz_mul(n, p1, p2);
    gmp_printf("Modulus (n): %Zx\n", n); // Print n in hexadecimal

    // Calculate φ(n) = (p1 - 1) * (p2 - 1)
    mpz_sub_ui(temp1, p1, 1);
    mpz_sub_ui(temp2, p2, 1);
    mpz_mul(phi, temp1, temp2);

    // Compute private key d = e^(-1) mod φ(n)
    if (mpz_invert(d, e, phi)) {
        gmp_printf("Private Key (d): %Zx\n", d); // Print d in hexadecimal
    } else {
        printf("Failed to calculate private key (d).\n");
        // Cleanup before exit
        mpz_clear(n);
        mpz_clear(d);
        mpz_clear(e);
        mpz_clear(p1);
        mpz_clear(p2);
        mpz_clear(phi);
        mpz_clear(temp1);
        mpz_clear(temp2);
        return 1;
    }

    // Cleanup
    mpz_clear(n);
    mpz_clear(d);
    mpz_clear(e);
    mpz_clear(p1);
    mpz_clear(p2);
    mpz_clear(phi);
    mpz_clear(temp1);
    mpz_clear(temp2);

    return 0;
}

// Function to generate very large prime numbers
void primegen(mpz_t result) {
    unsigned char buffer[4]; // To hold 4 bytes (32 bits)
    if (RAND_bytes(buffer, sizeof(buffer)) != 1) {
        fprintf(stderr, "Error generating random bytes.\n");
        exit(1);
    }

    unsigned int random_value = *(unsigned int *)buffer;
    random_value = (random_value % 9000001) + 999999; // Range: [999999, 9999999]

    mpz_t rand, temp;
    mpz_inits(rand, temp, NULL);
    mpz_set_ui(rand, random_value);

    mpz_mul_ui(temp, rand, 6);
    mpz_sub_ui(result, temp, 1);

    // Ensure result > 2
    if (mpz_cmp_ui(result, 2) <= 0) {
        mpz_set_ui(result, 3);
    }

    // Verify primality
    while (!miller_rabin(result)) {
        mpz_add_ui(result, result, 1);
    }

    mpz_clears(rand, temp, NULL);
}

// Function to perform Modular exponentiation
void mod_exp(mpz_t result, mpz_t base, mpz_t exp, mpz_t mod) {
    mpz_powm(result, base, exp, mod); // result = (base^exp) % mod
}

// Function to perform the Miller-Rabin primality test
int miller_rabin(mpz_t n) {
    int k = 5;
    if (mpz_cmp_ui(n, 2) < 0) return 0; // n <= 1 is not prime
    if (mpz_cmp_ui(n, 2) == 0) return 1; // 2 is prime
    if (mpz_even_p(n)) return 0;        // Even numbers > 2 are not prime

    // n - 1 = 2^s * d
    mpz_t d, s, temp;
    mpz_inits(d, s, temp, NULL);
    mpz_sub_ui(d, n, 1); // d = n - 1
    mpz_set(s, d);
    mpz_set_ui(temp, 2);

    int count = 0;
    while (mpz_divisible_p(s, temp)) {
        mpz_divexact(s, s, temp); // s = s / 2
        count++;
    }

    if (mpz_cmp_ui(s, 0) == 0) {
        fprintf(stderr, "Error: s became zero during Miller-Rabin setup.\n");
        return 0;
    }

    // Random state initialization
    gmp_randstate_t state;
    gmp_randinit_mt(state); // Initialize Mersenne Twister RNG
    mpz_t seed;
    mpz_init_set_ui(seed, time(NULL)); // Seed with current time
    gmp_randseed(state, seed);
    mpz_clear(seed);

    // Repeat k times for higher accuracy
    mpz_t a, x, n_minus_1;
    mpz_inits(a, x, n_minus_1, NULL);
    mpz_sub_ui(n_minus_1, n, 1); // n - 1

    for (int i = 0; i < k; i++) {
        if (mpz_cmp_ui(n_minus_1, 1) <= 0) {
            fprintf(stderr, "Error: Invalid range for random number generation.\n");
            mpz_clears(d, s, temp, a, x, n_minus_1, NULL);
            gmp_randclear(state);
            return 0; // Composite
        }

        mpz_urandomm(a, state, n_minus_1); // Random a in [0, n-1]
        mpz_add_ui(a, a, 2); // Random a in [2, n-2]

        mod_exp(x, a, d, n); // x = a^d % n
        if (mpz_cmp_ui(x, 1) == 0 || mpz_cmp(x, n_minus_1) == 0) continue;

        int is_composite = 1;
        for (int r = 0; r < count - 1; r++) {
            mod_exp(x, x, temp, n); // Square x
            if (mpz_cmp(x, n_minus_1) == 0) {
                is_composite = 0;
                break;
            }
        }
        if (is_composite) {
            mpz_clears(d, s, temp, a, x, n_minus_1, NULL);
            gmp_randclear(state);
            return 0; // Composite
        }
    }

    mpz_clears(d, s, temp, a, x, n_minus_1, NULL);
    gmp_randclear(state);
    return 1; // Probably prime
}
