const { S3Client, GetObjectCommand, DeleteObjectCommand,PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
require('dotenv').config()

const accessKey = process.env.AWS_ACCESS_KEY
const secretKey = process.env.AWS_SECRET_KEY
const s3 = new S3Client({
    region: 'ap-southeast-1',
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
    },
    endpoint:{
        url: "https://s3.ap-southeast-1.wasabisys.com"
    }
}
);

const getFileName = (path)=>{
    const compressfileMatch = path.match(/(?<=\/compress\/).*/)
    if(compressfileMatch != null){
        const compressfilePath = compressfileMatch[0]
        const compressFilename = compressfilePath.split("/")
        if(compressFilename.length > 0){
            return compressFilename[0] + ".zip"
        }
    }else{
        const cutPath = path.split("/")
        if(cutPath.length > 1){
            const filename = cutPath[cutPath.length - 1]
            return filename
        }
    }
    return null
}

const bucketName = "luckybrick"

// Function to upload a file
exports.uploadFile = async (filePath) => {
    try {
        console.log(filePath)
        const isExists = fs.existsSync(filePath)
        if(!isExists){
            throw new Error("file didnt exists");
        }
        const fileContent = fs.readFileSync(filePath);
        const filename = getFileName(filePath);
        if(filename == null){
            throw new Error("file name err");
        }

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: fileContent,
        });

        const response = await s3.send(command);
        console.log('File uploaded successfully:', response);
        return Promise.resolve(true)
    } catch (error) {
        console.log(error)
        return Promise.resolve(false)
    }
};

exports.downloadFile = async (downloadPath) => {
    return new Promise(async(resolve,reject)=>{
        try {
            const filename = getFileName(downloadPath);
            const newRegex = new RegExp(`^(.*?)(?=${filename.replace(".","\.").replace(".zip","")})`)
            const parentPath = downloadPath.match(newRegex)
            console.log(filename,parentPath,downloadPath)
            const isFileNameInvalid = filename == null || parentPath == null
            if(isFileNameInvalid){
                throw new Error("file name err");
            }
            
            const filePath = parentPath[0] + filename
            
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: filename,
            });
            console.log("adasda",filePath)
            const response = await s3.send(command);
            const fileStream = fs.createWriteStream(filePath);
            response.Body.pipe(fileStream);
            
            fileStream.on('finish', () => {
                console.log(`File downloaded successfully to ${filePath}`);
                return resolve(filePath)
            });
        } catch (error) {
            console.log(error)
            return reject(null)
        }
    })
};

exports.deleteFile = async (filePath) => {
    console.log(filePath)
    try {
        const filename = getFileName(filePath);
        if(filename == null){
            throw new Error("file name err");
        }

        const command = new DeleteObjectCommand({
            Bucket: bucketName, 
            Key: filename,
        });
        await s3.send(command);
        console.log(`File "${filename}" deleted successfully from bucket "${bucketName}".`);
    } catch (error) {
        console.log(error)
    }
};
