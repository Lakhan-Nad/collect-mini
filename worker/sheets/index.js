const { main } = require("./function.js");

function readJsonFromStdin() {
  let stdin = process.stdin;
  let inputChunks = [];

  stdin.resume();
  stdin.setEncoding("utf8");

  stdin.on("data", function (chunk) {
    inputChunks.push(chunk);
  });

  return new Promise((resolve, reject) => {
    stdin.on("end", function () {
      let inputJSON = inputChunks.join();
      resolve(JSON.parse(inputJSON));
    });
    stdin.on("error", function () {
      reject(Error("error during read"));
    });
    stdin.on("timeout", function () {
      reject(Error("timout during read"));
    });
  });
}

async function processData() {
  let job;
  try {
    job = await readJsonFromStdin();
    result = await Promise.resolve(main(job));
    console.log("Success");
  } catch (err) {
    console.error(err);
  }
}

processData();
