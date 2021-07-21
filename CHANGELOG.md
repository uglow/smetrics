# [3.0.0](https://github.com/uglow/smetrics/compare/v2.1.0...v3.0.0) (2021-07-21)


### Features

* **esm:** convert package to ES modules and update tooling ([0be3701](https://github.com/uglow/smetrics/commit/0be370186a50d1a968f92dd0eb4c8c4862a15645))
* **esm:** convert package to ES modules and update tooling ([74063cb](https://github.com/uglow/smetrics/commit/74063cb503c33db64b2208d4bdccba2718f6d06e))


### BREAKING CHANGES

* **esm:** Upgraded to use ES Modules (Node 14.13+ required)

There are no functional changes in this version. It is purely a CJS to ESM conversion
* **esm:** Upgraded to use ES Modules (Node 14.13+ required)

There are no functional changes in this version. It is purely a CJS to ESM conversion

# [2.1.0](https://github.com/uglow/smetrics/compare/v2.0.0...v2.1.0) (2020-11-09)


### Features

* **date:** allow custom date ([076fbe2](https://github.com/uglow/smetrics/commit/076fbe2b98e807c02ec131e9b8fd6a4089e80043))

# [2.0.0](https://github.com/uglow/smetrics/compare/v1.1.0...v2.0.0) (2020-11-04)


### Features

* support AWS Lambda by allowing filePath to be specified ([3d8e579](https://github.com/uglow/smetrics/commit/3d8e5794fffa64e435282ecb613a9b9b42424163))


### BREAKING CHANGES

* The API now supports a filePath parameter
to allow the temporary-file to be created in the /tmp folder on
AWS Lambda. Also, the client_email and private_key fields
have been renamed to clientEmail and privateKey, respectively.
