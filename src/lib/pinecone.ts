import { Pinecone } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import {PDFLoader} from 'langchain/document_loaders/fs/pdf'

let pinecone: Pinecone | null = null;

export const getPinecone = async () => {
    if (!pinecone) {
       const pinecone =  new Pinecone({
            environment:process.env.PINECONE_ENVIRONMENT!,
            apiKey: process.env.PINECONE_API_KEY!
        })
    }
    return pinecone
}

export async function loadS3IntoPinecone(fileKey: string) {
    // 1. obtain the pdf -> download and read from the pdf
    console.log('downloadoing from s3 into file system')
    const file_name = await downloadFromS3(fileKey);
    if (!file_name) {
        throw new Error('could not download from s3')
    }
    const loader = new PDFLoader(file_name);
    const pages = await loader.load();
    return pages;
      
}