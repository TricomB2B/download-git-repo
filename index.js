var Download = require("download");
var gitclone = require("git-clone");
var rm = require("rimraf").sync;

/**
 * Expose `download`.
 */

module.exports = download;

/**
 * Download `repo` to `dest` and callback `fn(err)`.
 * Changes by Todd Miller <todd.miller@tricomb2b.com>
 * Modified the function to work with Promises instead of
 * the outdated callback methodology. This allows it to work
 * a bit smoother with Yeoman Generators.
 *
 * @param {String} repo
 * @param {String} dest
 * @param {Function} fn
 */

function download (repo, dest, opts) {
  return new Promise((resolve, reject) => {
    opts = opts || {};
    let clone = opts.clone || false;

    repo = normalize(repo);
    let url = getUrl(repo, clone);

    if (clone) {
      gitclone(url, dest, { checkout: repo.checkout }, (err) => {
        if (err === undefined) {
          rm(dest + "/.git");
          resolve();
        }
        else {
          reject(new Error(`Could not find repository at ${url} or branch ${repo.checkout} could not be found.`));
        }
      });
    }
    else {
      new Download({ mode: "666", extract: true, strip: 1 })
        .get(url)
        .dest(dest)
        .run((err, files) => {
          if (err) reject(new Error(`Could not find repository at ${url}.`));
          resolve();
        });
    }
  });
}

/**
 * Normalize a repo string.
 *
 * @param {String} string
 * @return {Object}
 */

function normalize(repo) {
  var regex = /^((github|gitlab|bitbucket):)?((.+):)?([^/]+)\/([^#]+)(#(.+))?$/;
  var match = regex.exec(repo);
  var type = match[2] || "github";
  var host = match[4] || null;
  var owner = match[5];
  var name = match[6];
  var checkout = match[8] || "master";

  if (host == null) {
    if (type === "github")
      host = "github.com";
    else if (type === "gitlab")
      host = "gitlab.com";
    else if (type === "bitbucket")
      host = "bitbucket.com";
  }

  return {
    type: type,
    host: host,
    owner: owner,
    name: name,
    checkout: checkout
  };
}

/**
 * Return a zip or git url for a given `repo`.
 *
 * @param {Object} repo
 * @return {String}
 */

function getUrl(repo, clone) {
  var url;

  if (repo.type === "github")
    url = github(repo, clone);
  else if (repo.type === "gitlab")
    url = gitlab(repo, clone);
  else if (repo.type === "bitbucket")
    url = bitbucket(repo, clone);
  else
    url = github(repo, clone);

  return url;
}

/**
 * Return a GitHub url for a given `repo` object.
 *
 * @param {Object} repo
 * @return {String}
 */

function github(repo, clone) {
  var url;

  if (clone)
    url = "git@" + repo.host + ":" + repo.owner + "/" + repo.name + ".git";
  else
    url = "https://" + repo.host + "/" + repo.owner + "/" + repo.name + "/archive/" + repo.checkout + ".zip";

  return url;
}

/**
 * Return a GitLab url for a given `repo` object.
 *
 * @param {Object} repo
 * @return {String}
 */

function gitlab(repo, clone) {
  var url;

  if (clone)
    url = "git@" + repo.host + ":" + repo.owner + "/" + repo.name + ".git";
  else
    url = "https://" + repo.host + "/" + repo.owner + "/" + repo.name + "/repository/archive.zip?ref=" + repo.checkout;

  return url;
}

/**
 * Return a Bitbucket url for a given `repo` object.
 *
 * @param {Object} repo
 * @return {String}
 */

function bitbucket(repo, clone) {
  var url;

  if (clone)
    url = "git@" + repo.host + ":" + repo.owner + "/" + repo.name + ".git";
  else
    url = "https://" + repo.host + "/" + repo.owner + "/" + repo.name + "/get/" + repo.checkout + ".zip";

  return url;
}
