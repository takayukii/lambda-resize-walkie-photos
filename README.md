AWS Lambda Function 
=============

S3にアップロードされた画像を2種類のサイズにリサイズする。リサイズされた画像はそれぞれ同一バケット内にフォルダを作成し配備する。

アップロード方法
--

下記のようにnpm installしてからZIPでアーカイブし、AWSマネジメント・コンソールから手動でアップロードする

```
$ npm install
$ zip -r lambda-resize-walkie-photos.zip index.js node_modules
```
