import { Errors } from '../errors.js'
// see: https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const semVerRegex = /^([xX*]|0|[1-9]\d*)\.([xX*]|0|[1-9]\d*)\.([xX*]|0|[1-9]\d*)(?:-((?:[*]|0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:[*]|0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
export const parseSemVer = (ver) => {

  const match = semVerRegex.exec(ver)

  if (!match) {
    throw Errors.generic('INVALID_SEMVER','Version "' + ver + '" is not a valid sematic version' )
  }

  let [,,,,preRelease,buildMetadata] = match
  let n
  const [major,minor,patch] = match.slice(1,4).map(x => {
    n = Number.parseInt(x,10)
    return Number.isFinite(n) ? n : 'x'
  })

  preRelease = preRelease
    ? preRelease.split('.').map(x => {
      n = Number.parseInt(x,10)
      return Number.isFinite(n) ? n : x
    })
    : []

  return {major,minor,patch,preRelease,buildMetadata}
}

const semverToString = (semver) =>  {
  const {major,minor,patch,preRelease,buildMetadata} = semver
  let out = major + '.' + minor + '.' + patch
  if (preRelease.length > 0) out += "-" + preRelease.join('.');
  if (buildMetadata !== null && buildMetadata !== undefined) out += '+' + buildMetadata;
  return out
}

//const pgVerRegex = /^(0|[1-9]\d*)(?:([a-zA-Z]+)([1-9]+)|\.(0|[1-9]\d*)(?:\.(0|[1-9]\d*)(?:-([a-zA-Z]+)([1-9]\d*))?)?)(?:\s+.*)?$/
const postTenPgVerRegex = /^([xX*]|[1-9]\d*)(?:([a-zA-Z]+)([*]|[1-9]+)|\.([xX*]|0|[1-9]\d*))(?:\s+.*)?$/
const preTenPgVerRegex = /^([xX*]|[6-9])\.([xX*]|0|[1-9]\d*)\.([xX*]|0|[1-9]\d*)(?:-([a-zA-Z]+)([*]|[1-9]\d*))?(?:\s+.*)?$/
const pgVersionToSemver = (ver) => {
  let preReleaseType,nums
  let match = postTenPgVerRegex.exec(ver)
  if (match) {
    nums = [match[1],match[4],null,match[3]]
    preReleaseType = match[2]
  } else {
    match = preTenPgVerRegex.exec(ver)
    if (!match) return;
    preReleaseType = match[4]
    nums = [match[1],match[2],match[3],match[5]]
  }

  let n
  const [major,minor,patch,preRelease] = nums.map((x,i) => {
    if (!x) return 0;
    n = Number.parseInt(x,10)
    return Number.isFinite(n) ? n : (i < 3) ? 'x' : '*'
  })
  return {major,minor,patch,preRelease: preReleaseType ? [preReleaseType,preRelease] : []}
}

const semverToPgString = (semver) => {
  const {major,minor,patch,preRelease} = semver

  if (major > 9) {
    if (preRelease.length > 0) {
      return major + preRelease.join('')
    }
    return major + '.' + minor
  }

  return (preRelease.length > 0)
    ? major + '.' + minor + '.' + patch + '-' + preRelease.join('')
    : major + '.' + minor + '.' + patch

}

const semverProps = ['major','minor','patch','preRelease']
const compareSemver = (sv,cmp) => {
  let prop, a, b ,dab, apLen, bpLen, i, api, bpi
  for (let propIdx = 0; propIdx < semverProps.length; propIdx++) {
    prop = semverProps[propIdx]
    a = sv[prop]
    b = cmp[prop]

    if (prop === 'preRelease') {
      if (a === b) return 0;
      apLen = a?.length ?? 0
      bpLen = b?.length ?? 0

      if (apLen === 0) {
        if (bpLen > 0) {
          return 1
        }
        else {
          return 0;
        }
      } else if (bpLen === 0) {
        return -1
      }

      for (i = 0; i < apLen ; i++) {
        if (i === bpLen) return 1;
        api = a[i]
        bpi = b[i]
        if (api === bpi || api === '*' || bpi === '*') continue;
        if (typeof api === 'number') {
          if (typeof bpi === 'number') {
            dab = api - bpi
            if (dab !== 0) return dab;
          } else {
            return -1
          }
        }
        return api.localeCompare(bpi)
      }
      return apLen - bpLen
    }


    if (a === 'x' || b === 'x') continue;
    dab = a - b
    if (dab !== 0) return dab;

  }
  return 0
}

// TODO: add the below as tests
// const pgSemvers = [
//   ["10beta1",{major}]
// ]
//
// const semvers = [
//   [
//     ['2.6.7','2.6.23'],
//     ['2.0.0-RC1','2.0.0'],
//     ['1.5.3-alpha.1','1.5.3-alpha.beta'],
//     ['11.3.55-alpha.3','11.3.55-alpha.3.1'],
//     ['2.5.3','2.5.4-beta'],
//     ['2.x.x','3.0.0-alpha.1'],
//     ['1.2.3-*','1.2.3'],
//     ['7.6.5-alpha','7.6.5-alpha.*']
//   ],
//   [
//     ['2.x.x','2.9.0'],
//     ['1.*.5','1.3.5'],
//     ['5.x.X-alpha','5.*.0-alpha']
//   ]
// ]
// semvers.forEach((x,i) => {
//   x.map(([a,b]) => (i < 2) ? [parseSemVer(a),parseSemVer(b)] : [pgVersionToSemver(a),pgVersionToSemver(b)])
//     .forEach(([a,b]) => {
//
//       const res = compareSemver(a,b)
//       const res2 = compareSemver(b,a)
//
//       if (Math.abs(res) !== res2) {
//         console.log({r1:res,r2:res2})
//       }
//
//       if (i%2 === 0) {
//         if (res >= 0) {
//           console.log({res,a,b})
//           return
//         }
//         if (res2 <= 0) {
//           console.log({b,a,res2})
//         }
//       } else {
//         if (res !== 0) {
//           console.log({res,a,b})
//           return
//         }
//         if (res2 !== 0) {
//           console.log({b,a,res2})
//         }
//       }
//
//     })
// })
