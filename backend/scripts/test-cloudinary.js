const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'bjz9hax2',
  api_key: '976641323298923',
  api_secret: 'RORswraybsnrI3YiwGXQXt4QJTM',
  secure: true
});

async function test() {
  try {
    const sample = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const res = await cloudinary.uploader.upload(sample, {
      folder: 'ofenetwork/test'
    });
    console.log('Success:', res);
  } catch (err) {
    console.error('Error detail:', JSON.stringify(err, null, 2));
    console.error('Error message:', err.message);
  }
}

test();
