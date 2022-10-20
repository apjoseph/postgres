import { Errors } from '../errors.js'
// see: https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
// eslint-disable-next-line max-len
const semVerRegex = /^([xX*]|0|[1-9]\d*)\.([xX*]|0|[1-9]\d*)\.([xX*]|0|[1-9]\d*)(?:-((?:[*]|0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:[*]|0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

interface Semver extends Record<string, unknown> {
  major: string | number
  minor: string | number
  patch: string | number
  preRelease: (string | number)[]
  buildMetadata?: string | undefined

}

export const parseSemVer = (ver:string) :Semver => {

  const match = semVerRegex.exec(ver)

  if (!match)
    throw Errors.generic('INVALID_SEMVER', 'Version "' + ver + '" is not a valid sematic version' )

  let n
  const [major, minor, patch] = match.slice(1, 4).map(x => {
    n = Number.parseInt(x, 10)
    return Number.isFinite(n) ? n : 'x'
  })

  const preRelease = match[4]
    ? match[4].split('.').map(x => {
      n = Number.parseInt(x, 10)
      return Number.isFinite(n) ? n : x
    })
    : []

  const buildMetadata = match[5]
  return { major, minor, patch, preRelease, buildMetadata }
}

export const semverToString = (semver:Semver) : string => {
  const { major, minor, patch, preRelease, buildMetadata } = semver
  let out = major + '.' + minor + '.' + patch
  if (preRelease.length > 0) out += '-' + preRelease.join('.')
  if (buildMetadata !== null && buildMetadata !== undefined) out += '+' + buildMetadata
  return out
}

const postTenPgVerRegex = /^([xX*]|[1-9]\d*)(?:([a-zA-Z]+)([*]|[1-9]+)|\.([xX*]|0|[1-9]\d*))(?:\s+.*)?$/
// eslint-disable-next-line max-len
const preTenPgVerRegex = /^([xX*]|[6-9])\.([xX*]|0|[1-9]\d*)\.([xX*]|0|[1-9]\d*)(?:-([a-zA-Z]+)([*]|[1-9]\d*))?(?:\s+.*)?$/
export const pgVersionToSemver = (ver:string) : Semver => {
  let preReleaseType
    , nums
  let match = postTenPgVerRegex.exec(ver)
  if (match) {
    nums = [match[1], match[4], null, match[3]]
    preReleaseType = match[2]
  } else {
    match = preTenPgVerRegex.exec(ver)
    if (!match) throw Errors.generic('INVALID_SEMVER', 'Version "' + ver + '" is not a valid sematic version' )

    preReleaseType = match[4]
    nums = [match[1], match[2], match[3], match[5]]
  }

  let n
  const [major, minor, patch, preRelease] = nums.map((x, i) => {
    if (!x) return 0
    n = Number.parseInt(x, 10)
    return Number.isFinite(n) ? n : (i < 3) ? 'x' : '*'
  })
  return { major, minor, patch, preRelease: preReleaseType ? [preReleaseType, preRelease] : [] }
}

export const semverToPgString = (semver:Semver) : string => {
  const { major, minor, patch, preRelease } = semver

  if (major > 9) {
    if (preRelease.length > 0)
      return major + preRelease.join('')

    return major + '.' + minor
  }

  return (preRelease.length > 0)
    ? major + '.' + minor + '.' + patch + '-' + preRelease.join('')
    : major + '.' + minor + '.' + patch

}

export const compareSemver = (vA:Semver, vB:Semver) : number => {

  for (const [a, b] of [[vA.major, vB.major], [vA.minor, vB.minor], [vA.patch, vB.patch]])
    if (a !== b && typeof a === 'number' && typeof b === 'number') return (a as number) - (b as number)

  const a = vA.preRelease
  const b = vB.preRelease

  const aLen = a.length
  const bLen = b.length

  if (aLen === 0 && bLen === 0) return 0
  else if (aLen > 0 && bLen === 0) return -1
  else if (bLen > 0 && aLen === 0) return 1

  let ai:string | number
  let bi:string | number | undefined
  for (let i = 0; i < aLen; i++) {
    ai = a[i]
    bi = b[i]

    if (bi === undefined)
      return 1

    if (ai !== bi && ai !== '*' && bi !== '*') {
      const aIsNum = typeof ai === 'number'
      const bIsNum = typeof bi === 'number'

      if (aIsNum && bIsNum) return (ai as number) - (bi as number)
      else if (aIsNum) return -1
      else if (bIsNum) return 1
      return (ai as string).localeCompare(bi as string)
    }
  }

  return bLen > aLen ? -1 : aLen > bLen ? 1 : 0

}

// TODO: add the below as tests
// const pgSemvers = [
//   ['10beta1', { major }]
// ]

// console.log(compareSemver(parseSemVer("1.5.3"), parseSemVer("1.x.3")))

// const semvers = [
//   [
//     ['2.6.7', '2.6.23'],
//     ['2.0.0-RC1', '2.0.0'],
//     ['1.5.3-alpha.1', '1.5.3-alpha.beta'],
//     ['11.3.55-alpha.3', '11.3.55-alpha.3.1'],
//     ['2.5.3', '2.5.4-beta'],
//     ['2.x.x', '3.0.0-alpha.1'],
//     ['1.2.3-*', '1.2.3'],
//     ['7.6.5-alpha', '7.6.5-alpha.*']
//   ],
//   [
//     ['2.x.x', '2.9.0'],
//     ['1.*.5', '1.3.5'],
//     ['5.x.X-alpha', '5.*.0-alpha']
//   ]
// ]
// semvers.forEach((x, i) => {
//   x.map(([a, b]) => (i < 2) ? [parseSemVer(a), parseSemVer(b)] : [pgVersionToSemver(a), pgVersionToSemver(b)])
//     .forEach(([a, b]) => {
//
//       const res = compareSemver(a, b)
//       const res2 = compareSemver(b, a)
//
//       if (Math.abs(res) !== res2)
//         console.log({ r1:res, r2:res2 })
//
//
//       if (i % 2 === 0) {
//         if (res >= 0) {
//           console.log({ res, a, b })
//           return
//         }
//         if (res2 <= 0)
//           console.log({ b, a, res2 })
//
//       } else {
//         if (res !== 0) {
//           console.log({ res, a, b })
//           return
//         }
//         if (res2 !== 0)
//           console.log({ b, a, res2 })
//
//       }
//
//     })
// })
