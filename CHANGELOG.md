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
