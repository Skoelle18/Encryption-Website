#include <stdio.h>
#include <gmp.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
    if (argc != 4) {
        fprintf(stderr, "Usage: %s <input_file> <output_file> <n_hex>\n", argv[0]);
        return EXIT_FAILURE;
    }

    const char *input_file = argv[1];
    const char *output_file = argv[2];

    mpz_t n, e, m, c;
    mpz_init(n);
    mpz_init(e);
    mpz_init(m);
    mpz_init(c);

    // Set e to 65537 (common RSA public exponent)
    mpz_set_ui(e, 65537);

    // Convert hexadecimal n string to mpz_t
    if (mpz_set_str(n, argv[3], 16) != 0) {
        fprintf(stderr, "Invalid n format.\n");
        mpz_clear(n);
        mpz_clear(e);
        mpz_clear(m);
        mpz_clear(c);
        return EXIT_FAILURE;
    }

    // Open input file for reading in binary mode
    FILE *fin = fopen(input_file, "rb");
    if (!fin) {
        perror("Error opening input file");
        mpz_clear(n);
        mpz_clear(e);
        mpz_clear(m);
        mpz_clear(c);
        return EXIT_FAILURE;
    }

    // Open output file for writing in binary mode
    FILE *fout = fopen(output_file, "wb");
    if (!fout) {
        perror("Error opening output file");
        fclose(fin);
        mpz_clear(n);
        mpz_clear(e);
        mpz_clear(m);
        mpz_clear(c);
        return EXIT_FAILURE;
    }

    unsigned char buffer;
    while (fread(&buffer, 1, 1, fin) == 1) {
        // Convert each byte in the file to mpz_t
        mpz_set_ui(m, buffer);

        // Perform RSA encryption: c = m^e mod n
        mpz_powm(c, m, e, n);

        // Write encrypted value to the output file using binary format
        mpz_out_raw(fout, c);
    }

    // Clean up
    fclose(fin);
    fclose(fout);
    mpz_clear(n);
    mpz_clear(e);
    mpz_clear(m);
    mpz_clear(c);

    printf("RSA encryption completed successfully. Output written to '%s'.\n", output_file);

    return 0;
}
