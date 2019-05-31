const fileType = require('file-type')

module.exports = function (reporter, definition) {
  reporter.documentStore.registerComplexType('StaticPdfTemplateType', {
    pdfAssetShortid: { type: 'Edm.String' }
  })

  reporter.documentStore.model.entityTypes['TemplateType'].staticPdf = { type: 'jsreport.StaticPdfTemplateType' }

  reporter.extensionsManager.recipes.push({
    name: 'static-pdf',
    execute: execute(reporter)
  })
}

function execute (reporter) {
  return async (req, res) => {
    let pdfAsset
    let pdfAssetPath

    if (req.template.staticPdf && req.template.staticPdf.pdfAssetShortid) {
      const assetEntity = await reporter.documentStore.collection('assets').findOne({
        shortid: req.template.staticPdf.pdfAssetShortid
      }, req)

      if (!assetEntity) {
        throw reporter.createError(`Source Asset with shortid ${req.template.staticPdf.pdfAssetShortid} was not found`, {
          statusCode: 400
        })
      }

      pdfAssetPath = await reporter.folders.resolveEntityPath(assetEntity, 'assets', req)

      if (assetEntity.content == null) {
        throw reporter.createError(`Source PDF asset ${pdfAssetPath} should contain PDF`, {
          statusCode: 400
        })
      }

      reporter.logger.debug(`static-pdf is using asset ${pdfAssetPath}`, req)

      pdfAsset = assetEntity.content
    } else if (req.template.staticPdf.rawContent != null) {
      if (Buffer.isBuffer(req.template.staticPdf.rawContent)) {
        pdfAsset = req.template.staticPdf.rawContent
      } else if (typeof req.template.staticPdf.rawContent === 'string') {
        pdfAsset = Buffer.from(req.template.staticPdf.rawContent, 'base64')
      } else {
        throw reporter.createError(`Invalid value for req.template.staticPdf.rawContent, specify either a base64 string or a buffer`, {
          statusCode: 400
        })
      }

      reporter.logger.debug(`static-pdf is using inline content`, req)
    }

    if (!pdfAsset) {
      throw reporter.createError(`Source PDF asset was not specified, specify either req.template.staticPdf.pdfAssetShortid or req.template.staticPdf.rawContent`, {
        statusCode: 400
      })
    }

    const resultType = fileType(pdfAsset)

    if (!resultType || resultType.ext !== 'pdf') {
      throw reporter.createError(`Source PDF asset${pdfAssetPath != null ? ` ${pdfAssetPath}` : ''} should contain PDF${resultType && resultType.mime ? `. referenced asset is ${resultType.mime}` : ''}`, {
        statusCode: 400
      })
    }

    res.content = pdfAsset
    res.meta.contentType = 'application/pdf'
    res.meta.fileExtension = 'pdf'
  }
}
