import StaticPdfTemplateProperties from './StaticPdfTemplateProperties'
import Studio from 'jsreport-studio'

Studio.addPropertiesComponent(
  StaticPdfTemplateProperties.title,
  StaticPdfTemplateProperties,
  (entity) => entity.__entitySet === 'templates' && entity.recipe === 'static-pdf'
)

Studio.addApiSpec({
  template: {
    staticPdf: {
      rawContent: '<...base64 PDF...>',
      pdfAssetShortid: '...'
    }
  }
})
