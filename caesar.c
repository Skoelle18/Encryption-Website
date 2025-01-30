#include <stdio.h>
#include <string.h>
#include<stdlib.h>
void encryptDecrypt(const char *mode,const char *input_file,const char *output_file){
    FILE *fin = fopen(input_file,"rb");
    if(!fin){
        perror("error opening the file");
        return;
    }

    FILE *fout = fopen(output_file,"wb");
    if(!fout){
        perror("error opening the file");
        fclose(fin);
        exit(EXIT_FAILURE);
    }
    
    unsigned char buffer;
    size_t i=0;
    while (fread(&buffer, 1, 1, fin) == 1) {
        if (strcmp(mode, "encrypt") == 0) {
            buffer += 3; // Encrypt by adding 3
        } else if (strcmp(mode, "decrypt") == 0) {
            buffer -= 3; // Decrypt by subtracting 3
        }
        fwrite(&buffer, 1, 1, fout);
    }
    fclose(fin);
    fclose(fout);
    printf("Operation succssfully completed.Output written to %s.\n",output_file);
}
int main(int argc,char *argv[])
{
   if(argc!=4){
        fprintf(stderr,"Usage: %s <encrypt|decrypt> <input_file> <output_file> \n", argv[0]);
        return EXIT_FAILURE;
    }
    const char *mode = argv[1];
    const char *input_file = argv[2];
    const char *output_file = argv[3];
     if (strcmp(mode, "encrypt") == 0  || strcmp(mode, "decrypt") == 0) {
        encryptDecrypt(mode,input_file, output_file);
    } else {
        fprintf(stderr, "Invalid mode. Use 'encrypt' or 'decrypt'.\n");
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;

}