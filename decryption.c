#include <stdio.h>
#include <gmp.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    if (argc != 5) {
        fprintf(stderr, "Usage: %s <input_file> <output_file> <d_hex> <n_hex>\n", argv[0]);
        return EXIT_FAILURE;
    }

    const char *input_file = argv[1];
    const char *output_file = argv[2];

    mpz_t n, d, c, m;
    mpz_init(n);
    mpz_init(d);
    mpz_init(c);
    mpz_init(m);

    // Convert hexadecimal d and n strings to mpz_t
    if (mpz_set_str(d, argv[3], 16) != 0) {
        fprintf(stderr, "Invalid private key (d) format.\n");
        mpz_clear(n);
        mpz_clear(d);
        mpz_clear(c);
        mpz_clear(m);
        return EXIT_FAILURE;
    }

    if (mpz_set_str(n, argv[4], 16) != 0) {
        fprintf(stderr, "Invalid modulus (n) format.\n");
        mpz_clear(n);
        mpz_clear(d);
        mpz_clear(c);
        mpz_clear(m);
        return EXIT_FAILURE;
    }

    // Open input file for reading in binary mode
    FILE *fin = fopen(input_file, "rb");
    if (!fin) {
        perror("Error opening input file");
        mpz_clear(n);
        mpz_clear(d);
        mpz_clear(c);
        mpz_clear(m);
        return EXIT_FAILURE;
    }

    // Open output file for writing in binary mode
    FILE *fout = fopen(output_file, "wb");
    if (!fout) {
        perror("Error opening output file");
        fclose(fin);
        mpz_clear(n);
        mpz_clear(d);
        mpz_clear(c);
        mpz_clear(m);
        return EXIT_FAILURE;
    }

    printf("Starting decryption...\n");

    while (mpz_inp_raw(c, fin) > 0) {
        // Perform RSA decryption: m = c^d mod n
        mpz_powm(m, c, d, n);

        // Convert the decrypted integer (m) to a character
        unsigned long decrypted_value = mpz_get_ui(m);
        unsigned char decrypted_char = (unsigned char)decrypted_value;

        // Write the decrypted character to the output file
        fwrite(&decrypted_char, 1, 1, fout);
    }

    // Clean up
    fclose(fin);
    fclose(fout);
    mpz_clear(n);
    mpz_clear(d);
    mpz_clear(c);
    mpz_clear(m);

    printf("RSA decryption completed successfully. Output written to '%s'.\n", output_file);

    return 0;
}
