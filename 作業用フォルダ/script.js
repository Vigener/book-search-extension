// 改善案 >>>
// amazonの結果も表示する
//取得時間、✕のみの本を表示しない

const dataArr = [];

const systemID = {
  つくば市立図書館: "Ibaraki_Tsukuba",
  筑波大学付属図書館: "Univ_Tsukuba"
};


async function searchBooks() {

  // searchBooksの実行が完全に終了するまで、#statusのテキストを「検索中...」にする
  $("#status").text("検索中...");
  var userInput = document.getElementById("keyword").value;
  var key_word = userInput.replace(/[\s　]/g, "_");

  // localstorageのkeyを確認して、同じキーワードのkeyがあるか確認し、keywordが被らないように"keyword_1","keyword_2"というように数字を足してkeywordを設定、なければそのまま設定する
  const keys = Object.keys(localStorage);
  const matchingKeys = keys.filter(function (key) {
    return key.includes(key_word);
  });
  const key = matchingKeys.length > 0 ? `${key_word}_${matchingKeys.length + 1}` : key_word;

  const dataObj = {
    keyword: key,
    detailData: {
      BookData: [],
      calilData: []
    }
  };

  // $("#output").html(originalContent_output);
  console.clear()
  var google_api_key = "https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(userInput) + "&printType=books&maxResults=20";
  // console.log(google_api_key);
  try {
    var response = await fetch(google_api_key);
    var data = await response.json();


    const BookData = dataObj.detailData.BookData;
    const calilData = dataObj.detailData.calilData;
    const isbnData = [];

    for (let i = 0; i < 20; i++) { // /^\d{10}$/.test(data.items[i].volumeInfo.industryIdentifiers[0].identifier)
      var isbnTest = null;
      function checkImageLinks(data) {
        // for (let i = 0; i < data.items.length; i++) {
        // }
        if (data.items[i].volumeInfo.hasOwnProperty('imageLinks')) {
          // imageLinksオブジェクトが存在する場合の処理
          BookData.push(data.items[i].volumeInfo);
        }
      }
      const check_isbn = data.items[i].volumeInfo.industryIdentifiers;
      if (check_isbn && check_isbn.length > 0) {
        isbnTest = check_isbn[0].type;
      }
      if (isbnTest === "ISBN_10" || isbnTest === "ISBN_13") {
        checkImageLinks(data);
      }
    }
    //検索できるbookdataがあるかどうか確認
    if (BookData == []) {
      $("#console").html("検索できる本がありませんでした。");
    }

    const fetch_calil = async (apiKey) => {
      try {
        const response = await fetch(apiKey);
        const data = await response.json();
        if (data.continue === 1) {
          return fetch_calil(apiKey); // 再帰的にリクエストを行う
        } else {
          calilData.push(data);
          const obtained_time = (() => {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${month}/${day} ${hours}:${minutes}`;
          })();
          dataObj.obtained_time = obtained_time; // Add obtained_time to dataObj
          dataObj.userInput = userInput;
          dataArr.push(dataObj);
          // Save dataObj to local storage
          // localstorageのkeyを確認して、同じキーワードのkeyがあるか確認し、keywordが被らないように"keyword_1","keyword_2"というように数字を足してkeywordを設定、なければそのまま設定する
          // const keys = Object.keys(localStorage);
          // const matchingKeys = keys.filter(function (key) {
          //   return key.includes(key_word);
          // });
          // const key = matchingKeys.length > 0 ? `${key_word}_${matchingKeys.length + 1}` : key_word;
          localStorage.setItem(key, JSON.stringify(dataObj));
          // display_data(userInput, key_word, obtained_time, dataArr);
          display_data_ver2(dataObj);
          $("#output").css("visibility", "visible");
          $("#keyword").val('');
          $("#keyword").focus();
          $("#status").text("検索結果");
        }
      } catch (error) {
        console.log('エラーが発生しました', error);
      }
    };

    const len_Data = BookData.length
    const num_of_display = len_Data > 3 ? 3 : len_Data; //　何冊の本を検索結果として表示するか設定
    for (let i = 0; i < num_of_display; i++) {
      isbnData[i] = BookData[i].industryIdentifiers[0].identifier;
      if (i == num_of_display - 1) {
        const ISBN_list = isbnData.join(',');
        const SYSTEM_ID_list = Object.values(systemID).join(','); //検索したい図書館のシステムIDを,で区切りながら羅列する
        const apiKey = "https://api.calil.jp/check?appkey={468b8efa42978747b9bca6d60a9c384d}&isbn=" + ISBN_list + "&systemid=" + SYSTEM_ID_list + "&callback=no";
        await fetch_calil(apiKey);
      }
    }

  } catch (error) {
    console.log("エラーが発生しました", error);
  }
}


//test
// localstorageを削除する関数
const deleteStorage = function (key) {
  localStorage.removeItem(key);
};

// id = "btnReset"が押されたときにdeleteStorageを実行する
$("#btnReset").on('click', function () {
  const keys = Object.keys(localStorage);
  keys.forEach(function (key) {
    deleteStorage(key);
  });
  location.reload();
});

// .btnResetForEachが押されたときにその要素のidを取得し、そのidを持つlocalstorageを削除する
$("#output").on('click', '.btnResetForEach', function () {
  const key = $(this).attr("id");
  deleteStorage(key);
  $(`.${key}`).remove();
  location.reload();
});



//表への表示を行う関数
const display_data_ver2 = function (dataObj) {
  const key_word = dataObj.keyword;
  const obtained_time = dataObj.obtained_time;
  const userInput = dataObj.userInput;
  const current_data = dataObj.detailData;
  const display_count = Object.keys(current_data.calilData[0].books).length;
  let displayArea = $('#template').clone();
  displayArea.attr("id", '');
  displayArea.attr("class", `${key_word}`);
  $("#output").prepend(displayArea);
  // //検索キーワードを表示するヘッダーを作成
  test = $(`.${key_word} .keyword_area`).html();
  console.log(test);
  $(`.${key_word} .keyword_area .keyword_header`).html("「" + userInput + "」の検索結果 (取得時間: " + obtained_time + ")");
  $(`.${key_word} .keyword_area .btnResetForEach`).attr("id", `${key_word}`);
  //それぞれの本のデータを表示
  $(`.${key_word} .book_data_area`).remove();
  for (let i = 0; i < display_count; i++) {
    let clonedElement = $(`#template .book_data_area`).clone();
    clonedElement.attr("id", '');
    clonedElement.attr("class", `data${i}_${key_word}`);
    $(`.${key_word}`).append(clonedElement);
    if (current_data.BookData[i].imageLinks.thumbnail) {
      var img_scr = "<img src='" + current_data.BookData[i].imageLinks.thumbnail + "'/>"; // 本の表紙をHTMLに表示
      $(`.data${i}_${key_word} .image`).html(img_scr);
    }
    $(`.data${i}_${key_word} .title`).html(current_data.BookData[i].title); //本のタイトルを表示
    $(`.data${i}_${key_word} .author`).html("著者: " + current_data.BookData[i].authors); //本の著者を表示
    $(`.data${i}_${key_word} .publishDate`).html("出版年月日: " + current_data.BookData[i].publishedDate); //出版年月日を表示
    //蔵書状況を表示
    //URLのリンクを追加
    console.log(current_data);
    const isbnData = [];
    for (let i = 0; i < 3; i++) {
      isbnData[i] = current_data.BookData[i].industryIdentifiers[0].identifier;
    }
    $(`.data${i}_${key_word} .ls_area .lendingStatus_cityLib .link`).attr("href", current_data.calilData[0].books[isbnData[i]].Ibaraki_Tsukuba.reserveurl);
    $(`.data${i}_${key_word} .ls_area .lendingStatus_univLib .link`).attr("href", current_data.calilData[0].books[isbnData[i]].Univ_Tsukuba.reserveurl);
    // cityLibについて
    const places_cityLib = ["中央館", "谷田部", "筑波", "小野川", "茎崎", "自動車"];
    const libkey_city = current_data.calilData[0]["books"][isbnData[i]][systemID["つくば市立図書館"]].libkey;
    for (let index = 0; index < 6; index++) {
      var place_cityLib = places_cityLib[index];
      if (libkey_city[place_cityLib] == "貸出可") {
        $(`.data${i}_${key_word} .lendingStatus_cityLib .${place_cityLib}`).html("◯");
      } else if (libkey_city[place_cityLib] == "貸出中") {
        $(`.data${i}_${key_word} .lendingStatus_cityLib .${place_cityLib}`).html("△");
      } else {
        $(`.data${i}_${key_word} .lendingStatus_cityLib .${place_cityLib}`).html("✕");
      }
    }
    // univLibについて
    const places_univLib = ["中央", "医学", "図情"];
    // var places_univLib = Object.keys(current_data.calilData.univLib[i].libkey);
    var libkey_univ = current_data.calilData[0].books[isbnData[i]][systemID["筑波大学付属図書館"]].libkey;
    for (let index = 0; index < 3; index++) {
      var place_univLib = places_univLib[index];
      if (libkey_univ[place_univLib] == "貸出可") {
        $(`.data${i}_${key_word} .lendingStatus_univLib .${place_univLib}`).html("◯");
      } else if (libkey_univ[place_univLib] == "貸出中") {
        $(`.data${i}_${key_word} .lendingStatus_univLib .${place_univLib}`).html("△");
      } else {
        $(`.data${i}_${key_word} .lendingStatus_univLib .${place_univLib}`).html("✕");
      }
    }
  }
};
// リロード時
window.onload = function () {
  // localstorageに保存されているdataArrのすべての要素に対して、display_data_ver2を実行する
  const keys = Object.keys(localStorage);
  keys.forEach(function (key) {
    const dataObj = JSON.parse(localStorage.getItem(key));
    display_data_ver2(dataObj);
  });
};


const display_data = function (userInput, key_word, obtained_time, dataArr) {
  const matchingItem = dataArr.find(function (item) {
    return item.keyword === key_word && item.obtained_time === obtained_time;
  });
  const current_data = matchingItem ? matchingItem.detailData : null;
  const display_count = Object.keys(current_data.calilData[0].books).length;
  let displayArea = $('#template').clone();
  displayArea.attr("id", '');
  displayArea.attr("class", `${key_word}`);
  $("#output").prepend(displayArea);

  test = $(`.${key_word} .keyword_area`).html();
  console.log(test);
  $(`.${key_word} .keyword_area .keyword_header`).html("「" + userInput + "」の検索結果 (取得時間: " + obtained_time + ")");
  //それぞれの本のデータを表示
  $(`.${key_word} .book_data_area`).remove();
  for (let i = 0; i < display_count; i++) {
    let clonedElement = $(`#template .book_data_area`).clone();
    clonedElement.attr("id", '');
    clonedElement.attr("class", `data${i}_${key_word}`);
    $(`.${key_word}`).append(clonedElement);

    if (current_data.BookData[i].imageLinks.thumbnail) {
      var img_scr = "<img src='" + current_data.BookData[i].imageLinks.thumbnail + "'/>"; // 本の表紙をHTMLに表示
      $(`.data${i}_${key_word} .image`).html(img_scr);
    }
    $(`.data${i}_${key_word} .title`).html(current_data.BookData[i].title); //本のタイトルを表示
    $(`.data${i}_${key_word} .author`).html("著者: " + current_data.BookData[i].authors); //本の著者を表示
    $(`.data${i}_${key_word} .publishDate`).html("出版年月日: " + current_data.BookData[i].publishedDate); //出版年月日を表示
    //蔵書状況を表示
    //URLのリンクを追加
    const isbnData = [];
    for (let i = 0; i < 3; i++) {
      isbnData[i] = current_data.BookData[i].industryIdentifiers[0].identifier;
    }
    $(`.data${i}_${key_word} .ls_area .lendingStatus_cityLib .link`).attr("href", current_data.calilData[0].books[isbnData[i]].Ibaraki_Tsukuba.reserveurl);
    $(`.data${i}_${key_word} .ls_area .lendingStatus_univLib .link`).attr("href", current_data.calilData[0].books[isbnData[i]].Univ_Tsukuba.reserveurl);
    // cityLibについて
    const places_cityLib = ["中央館", "谷田部", "筑波", "小野川", "茎崎", "自動車"];
    const libkey_city = current_data.calilData[0]["books"][isbnData[i]][systemID["つくば市立図書館"]].libkey;
    // console.log(libkey_city);
    for (let index = 0; index < 6; index++) {
      var place_cityLib = places_cityLib[index];
      if (libkey_city[place_cityLib] == "貸出可") {
        $(`.data${i}_${key_word} .lendingStatus_cityLib .${place_cityLib}`).html("◯");
      } else if (libkey_city[place_cityLib] == "貸出中") {
        $(`.data${i}_${key_word} .lendingStatus_cityLib .${place_cityLib}`).html("△");
      } else {
        $(`.data${i}_${key_word} .lendingStatus_cityLib .${place_cityLib}`).html("✕");
      }
    }
    // univLibについて
    const places_univLib = ["中央", "医学", "図情"];
    // var places_univLib = Object.keys(current_data.calilData.univLib[i].libkey);
    var libkey_univ = current_data.calilData[0].books[isbnData[i]][systemID["筑波大学付属図書館"]].libkey;
    for (let index = 0; index < 3; index++) {
      var place_univLib = places_univLib[index];
      if (libkey_univ[place_univLib] == "貸出可") {
        $(`.data${i}_${key_word} .lendingStatus_univLib .${place_univLib}`).html("◯");
      } else if (libkey_univ[place_univLib] == "貸出中") {
        $(`.data${i}_${key_word} .lendingStatus_univLib .${place_univLib}`).html("△");
      } else {
        $(`.data${i}_${key_word} .lendingStatus_univLib .${place_univLib}`).html("✕");
      }
    }
  }
  // 書込み後、templateを削除
  // $("#display_search_keyword").remove();
  // $("#template").remove();
  // $(`.${key_word} #book_data_area`).remove();
  // 処理が完了したら表示
  $("#output").css("visibility", "visible");
  // add();
  // readHistory();
  $("#keyword").val('');
  $("#keyword").focus();
};

$(document).ready(function () {
  // $("#output").css("visibility", "hidden");
  $("#keyword").focus();
  // readHistory();
});

$("#begin_search").click(function () {
  searchBooks();
});

$("#keyword").keypress(function (event) {
  if (event.key === "Enter") {
    searchBooks();
  }
});


///感想
// APIで取得してくるデータの形式が毎回同じとは限らないため、そのための場合分けや処理の仕方を考えるのが難しかった。
//　jsonファイル？の扱いにある程度詳しくなれた
// データをリスト化するときにとりあえず使えればいいという観点で取得してしまったため、そのまとまったデータだけ見ると分かりづらい（他のことがしたいときに応用が効かない）となってしまった。データの扱いについても正しく学び実践することが必要だと感じた.
