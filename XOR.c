#include<stdio.h>
#include<stdlib.h>
#include<string.h>

void encryptDecrypt(const char *input_file,const char *output_file,const char *key){
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

    size_t key_len=strlen(key);
    if(key_len==0){
        fprintf(stderr,"key must not be empty");
        fclose(fin);
        fclose(fout);
        exit(EXIT_FAILURE);
    }

    unsigned char buffer;
    size_t i = 0;

    while(fread(&buffer,1,1,fin)==1){
        buffer=buffer^key[i%key_len];
        fwrite(&buffer,1,1,fout);
        i++;
    }

    fclose(fin);
    fclose(fout);

    printf("Operation completed successfully. Output written to '%s'.\n", output_file);

}

int main(int argc,char *argv[]){
    if(argc!=5){
        fprintf(stderr,"Usage: %s <encrypt|decrypt> <input_file> <output_file> <key>\n", argv[0]);
        return EXIT_FAILURE;
    }

    const char *mode = argv[1];
    const char *input_file = argv[2];
    const char *output_file = argv[3];
    const char *key = argv[4];

    if (strcmp(mode, "encrypt") == 0 || strcmp(mode, "decrypt") == 0) {
        encryptDecrypt(input_file, output_file, key);
    } else {
        fprintf(stderr, "Invalid mode. Use 'encrypt' or 'decrypt'.\n");
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;

}