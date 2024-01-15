import { Pinecone } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './s3-server';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { Document, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter'

let pinecone: Pinecone | null = null;

export const getPinecone = async () => {
    if (!pinecone) {
       const pinecone =  new Pinecone({
            environment:process.env.PINECONE_ENVIRONMENT!,
            apiKey: process.env.PINECONE_API_KEY!
        })
    }
    return pinecone
};

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: {pageNumber: number}
    }
}

export async function loadS3IntoPinecone(fileKey: string) {
    // 1. obtain the pdf -> download and read from the pdf
    console.log('downloadoing from s3 into file system')
    const file_name = await downloadFromS3(fileKey);
    if (!file_name) {
        throw new Error('could not download from s3')
    }
    const loader = new PDFLoader(file_name);
    const pages = (await loader.load()) as PDFPage[];

    //2. split and segement the pdf into smaller paragraphs
    // return pages;  
    //pages = array(10)
    const documents = await Promise.all(pages.map(prepareDocument));
    //documents = array(98)

    //3. vectorize and embed individual documents
    
}

//truncate paragraphs to pinecone byte sizes 36000
export const truncateStringByBytes = (str: string, bytes: number)=> {
    const enc = new TextEncoder()
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0,bytes))
}

async function prepareDocument(page: PDFPage) {
        let {pageContent, metadata} = page
        pageContent = pageContent.replace(/\n/g, '') //regex
        //split the docs
        const splitter = new RecursiveCharacterTextSplitter()
        const docs = await splitter.splitDocuments([
            new Document({
                pageContent,
                metadata: {
                    pageNumber: metadata.loc.pageNumber,
                    text: truncateStringByBytes(pageContent, 36000)
                }
            })
        ])
        return docs
    }