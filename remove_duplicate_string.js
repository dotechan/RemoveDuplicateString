/**
 * Usage:
 *      node remove_duplicate_string.js
 *
 * Overview:
 *      Androidのstring.xmlから重複定義されている用語を削除する
 *
 * Description:
 *      ./srcディレクトリ配下に各言語のvalues-xxxファイルを配置する
 *      ./src/values-xxx/配下のstring-xxx.xmlファイルの中身を検証する
 *      attribute valueが重複しているelementが存在する場合は1つ目以降のelementを削除する
 *      加工したxmlファイルは./destディレクトリに出力される
 */

const dom = require("xmldom").DOMParser;
const fs = require("fs");
const util = require("util");
const SRC_DIR_PATH = "./src/";
const DEST_DIR_PATH = "./dest/";

const mkdir = util.promisify(fs.mkdir);

// 加工後のxmlファイルを生成して格納するディレクトリを生成する
mkdir(DEST_DIR_PATH)
  .then(() => {
    console.log(`Suceeded in creating a ${DEST_DIR_PATH} directory.`);
  })
  .catch((reason) => {
    console.log(`Failed to creat a ${DEST_DIR_PATH} directory.`);
    console.log(`${reason}`);
  });

fs.readdirSync(SRC_DIR_PATH).forEach((valuesDir) => {
  fs.readdirSync(SRC_DIR_PATH + valuesDir).forEach((fileName) => {
    console.log(`start copying ${fileName}`);

    const SRC_XML_FILE_PATH = SRC_DIR_PATH + valuesDir + "/";
    const xmlFile = fs.readFileSync(SRC_XML_FILE_PATH + fileName, {
      encoding: "utf8",
      mode: "w+",
    });

    const document = new dom().parseFromString(xmlFile);
    // NodeListがライブ(DOM内の更新が自動的にコレクションに反映される)か
    // 静的(DOM内の変更がコレクションの内容に影響を与えない場合)の二種類がある
    // getElementsByTagNameはライブであるNodeListを返す
    const nodeList = document.getElementsByTagName("string");
    let preAttributeValue = "";
    // XML内のAttributeNodeのValueが重複しているElementを最初のElement以外削除する
    // 前提条件:XML内のElementはname属性の値でソートされている
    Array.from(nodeList).forEach((node) => {
      const attributeValue = node.getAttribute("name").nodeValue;
      if (attributeValue == preAttributeValue) {
        const oldChild = node.parentNode.removeChild(node);
        console.log(
          `remove element, elementNodeName = ${oldChild.nodeName}, attributeNodeValue = ${attributeValue}, textNodeValue = ${oldChild.firstChild.nodeValue}`
        );
      }
      preAttributeValue = attributeValue;
    });

    // DOMを編集しただけではXMLファイルに反映されないのでDOMから文字列にシリアライズして、文字列からファイルを作成する
    const XMLSerializer = require("xmldom").XMLSerializer;
    const xmlStr = new XMLSerializer().serializeToString(document);
    const DEST_XML_FILE_PATH = DEST_DIR_PATH + valuesDir + "/";
    mkdir(DEST_XML_FILE_PATH)
      .then(() => {
        console.log(`Suceeded in creating a ${DEST_XML_FILE_PATH} directory.`);
      })
      .catch((reason) => {
        console.log(`Failed to creat a ${DEST_XML_FILE_PATH} directory.`);
        console.log(`${reason}`);
      });
    fs.writeFileSync(DEST_XML_FILE_PATH + fileName, xmlStr, {
      encoding: "utf8",
      mode: 0o666,
      flag: "w",
    });

    console.log(`finish copying ${fileName}`);
  });
  console.log("\n");
});
