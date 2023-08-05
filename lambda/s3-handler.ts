// index.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// S3 Bucket Name
const bucketName = process.env.S3_BUCKET_NAME;
// FileName
const fileName = 'test.json';

// Region
const region = process.env.REGION;

// Lambdaハンドラー関数
exports.LambdaRecursionDetectionS3Handler = async function (event: any, context: any) {
  console.log(JSON.stringify(event, null, 2));
  console.log(JSON.stringify(context, null, 2));
  try {
    // Save JSON Data
    const data = { message: "This is a pen." }; 

    // JSON Data Save S3 Bucket.
    await saveJsonToS3(data);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "JSON File Save S3 Bucket." }),
    };
  } catch (error) {
    console.error("An error has occurred.", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "An error has occurred." }),
    };
  }
}

async function saveJsonToS3(data: any) {
  const s3Client = new S3Client({region});
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  };

  const command = new PutObjectCommand(params);

  try {
    // JSON File Save S3
    await s3Client.send(command);
    console.log("JSON file has been saved to S3");
  } catch (error) {
    console.error("An error occurred while saving the JSON file", error);
    throw error;
  }
}