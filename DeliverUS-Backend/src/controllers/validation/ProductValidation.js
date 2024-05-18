import { check } from 'express-validator'
import { Restaurant, Product } from '../../models/models.js'
import { checkFileIsImage, checkFileMaxSize } from './FileValidationHelper.js'
import { Sequelize } from 'sequelize'

const maxFileSize = 2000000 // around 2Mb

const checkRestaurantExists = async (value, { req }) => {
  try {
    const restaurant = await Restaurant.findByPk(req.body.restaurantId)
    if (restaurant === null) {
      return Promise.reject(new Error('The restaurantId does not exist.'))
    } else { return Promise.resolve() }
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

const checkPromotedProductsEdit = async (value, { req }) => {
  try {
    const product = await Product.findByPk(req.params.productId)
    const promotedItems = await Product.findOne({
      where: { restaurantId: product.restaurantId, promotedAt: { [Sequelize.Op.ne]: null } },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'promotedItems']
      ]
    })
    if (!product.promotedAt && promotedItems.dataValues.promotedItems >= 5 && req.body.promotedAt) {
      return Promise.reject(new Error('You can only have 5 simultaneously promoted restaurants'))
    } else {
      return Promise.resolve()
    }
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

const checkPromotedProductsCreate = async (value, { req }) => {
  try {
    const promotedItems = await Product.findOne({
      where: { restaurantId: req.body.restaurantId, promotedAt: { [Sequelize.Op.ne]: null } },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'promotedItems']
      ]
    })
    if (req.body.promotedAt && promotedItems.dataValues.promotedItems >= 5) {
      return Promise.reject(new Error('You can only have 5 simultaneously promoted restaurants'))
    } else {
      return Promise.resolve()
    }
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

const create = [
  check('name').exists().isString().isLength({ min: 1, max: 255 }).trim(),
  check('description').optional({ checkNull: true, checkFalsy: true }).isString().isLength({ min: 1 }).trim(),
  check('price').exists().isFloat({ min: 0 }).toFloat(),
  check('order').default(null).optional({ nullable: true }).isInt().toInt(),
  check('availability').optional().isBoolean().toBoolean(),
  check('productCategoryId').exists().isInt({ min: 1 }).toInt(),
  check('restaurantId').exists().isInt({ min: 1 }).toInt(),
  check('restaurantId').custom(checkRestaurantExists),
  check('image').custom((value, { req }) => {
    return checkFileIsImage(req, 'image')
  }).withMessage('Please upload an image with format (jpeg, png).'),
  check('image').custom((value, { req }) => {
    return checkFileMaxSize(req, 'image', maxFileSize)
  }).withMessage('Maximum file size of ' + maxFileSize / 1000000 + 'MB'),
  check('promotedAt').custom(checkPromotedProductsCreate)
]

const update = [
  check('name').exists().isString().isLength({ min: 1, max: 255 }),
  check('description').optional({ nullable: true, checkFalsy: true }).isString().isLength({ min: 1 }).trim(),
  check('price').exists().isFloat({ min: 0 }).toFloat(),
  check('order').default(null).optional({ nullable: true }).isInt().toInt(),
  check('availability').optional().isBoolean().toBoolean(),
  check('productCategoryId').exists().isInt({ min: 1 }).toInt(),
  check('restaurantId').not().exists(),
  check('image').custom((value, { req }) => {
    return checkFileIsImage(req, 'image')
  }).withMessage('Please upload an image with format (jpeg, png).'),
  check('image').custom((value, { req }) => {
    return checkFileMaxSize(req, 'image', maxFileSize)
  }).withMessage('Maximum file size of ' + maxFileSize / 1000000 + 'MB'),
  check('restaurantId').not().exists(),
  check('promotedAt').custom(checkPromotedProductsEdit)
]

export { create, update }
