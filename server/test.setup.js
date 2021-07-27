for (const keys of Object.keys(global)) {
  if (keys.startsWith("CONFIG__")) {
    const key = keys.replace("CONFIG__", "");
    process.env[key] = global[keys];
  }
}
