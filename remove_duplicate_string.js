/**
 * Usage:
 *      node remove_duplicate_string.js
 *
 * Overview:
 *      Androidのstrings.xmlから重複定義されている用語を削除する
 *
 * Description:
 *      ./srcディレクトリ配下に各言語のvalues-xxxファイルを配置する
 *      ./src/values-xxx/配下のstrings.xmlファイルの中身を検証する
 *      attribute valueが重複しているelementが存在する場合は1つ目以降のelementを削除する
 *      加工したxmlファイルは./destディレクトリに出力される
 *      destディレクトリが既に存在する場合はエラーとする
 */

const dom = require("xmldom").DOMParser;
const fs = require("fs");
const util = require("util");
const SRC_DIR_PATH = "./src/";
const DEST_DIR_PATH = "./dest/";
const STRING_FILE_NAME = "strings.xml";

const mkdir = util.promisify(fs.mkdir);
const readdir = util.promisify(fs.readdir);
const readFilePromise = util.promisify(fs.readFile);
const writeFilePromise = util.promisify(fs.writeFile);

/**
 * await構文を利用するためにasync関数でwrapしている
 */
async function removeDuplicateString() {
  // 加工後のxmlファイルを生成して格納するディレクトリを生成する
  try {
    await mkdir(DEST_DIR_PATH);
  } catch (err) {
    console.log(`Failed to creat a ${DEST_DIR_PATH} directory.`);
    console.log(`${err}`);

    return;
  }
  console.log(`Suceeded in creating a ${DEST_DIR_PATH} directory.`);
  console.log("\n");

  // 各言語が格納されているvalues-xxxディレクトリの名前を取得する
  let dirs;
  try {
    dirs = await readdir(SRC_DIR_PATH);
  } catch (err) {
    console.log(`Failed to read a ${SRC_DIR_PATH} directory.`);
    console.log(`${err}`);

    return;
  }

  dirs.forEach((dirName) => {
    fixFile(dirName);
  });
}

async function fixFile(dirName) {
  console.log(`start copying ${STRING_FILE_NAME}`);

  const SRC_STRINGS_FILE_PATH = SRC_DIR_PATH + dirName + "/" + STRING_FILE_NAME;

  let xmlFile;
  try {
    xmlFile = await readFilePromise(SRC_STRINGS_FILE_PATH, {
      encoding: "utf-8",
      mode: "w+",
    });
  } catch (err) {
    console.log(`Failed to read a ${SRC_STRINGS_FILE_PATH} file.`);
    console.log(`${err}`);
  }

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
  const DEST_XML_FILE_PATH = DEST_DIR_PATH + dirName + "/";

  try {
    await mkdir(DEST_XML_FILE_PATH);
  } catch (err) {
    console.log(`Failed to creat a ${DEST_XML_FILE_PATH} directory.`);
    console.log(`${err}`);

    return;
  }
  console.log(`Suceeded in creating a ${DEST_XML_FILE_PATH} directory.`);

  try {
    await writeFilePromise(DEST_XML_FILE_PATH + STRING_FILE_NAME, xmlStr, {
      encoding: "utf8",
      mode: 0o666,
      flag: "w",
    });
  } catch (err) {
    console.log(
      `Failed to write a ${DEST_XML_FILE_PATH + STRING_FILE_NAME} file.`
    );
    console.log(`${err}`);

    return;
  }

  console.log(`finish copying ${STRING_FILE_NAME}`);
  console.log("\n");
}

removeDuplicateString();
