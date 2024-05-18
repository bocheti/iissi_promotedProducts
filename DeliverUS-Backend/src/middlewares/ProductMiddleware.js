import { Order, Product, Restaurant } from '../models/models.js'
import Sequelize from 'sequelize'
const checkProductOwnership = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.productId, { include: { model: Restaurant, as: 'restaurant' } })
    if (req.user.id === product.restaurant.userId) {
      return next()
    } else {
      return res.status(403).send('Not enough privileges. This entity does not belong to you')
    }
  } catch (err) {
    return res.status(500).send(err)
  }
}
const checkProductRestaurantOwnership = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.body.restaurantId)
    if (req.user.id === restaurant.userId) {
      return next()
    } else {
      return res.status(403).send('Not enough privileges. This entity does not belong to you')
    }
  } catch (err) {
    return res.status(500).send(err)
  }
}

const checkProductHasNotBeenOrdered = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.productId, { include: { model: Order, as: 'orders' } })
    if (product.orders.length === 0) {
      return next()
    } else {
      return res.status(409).send('This product has already been ordered')
    }
  } catch (err) {
    return res.status(500).send(err.message)
  }
}

const checkPromotedProducts = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.productId)
    const promotedItems = await Product.findAll({
      where: { restaurantId: product.restaurantId, promotedAt: { [Sequelize.Op.ne]: null } },
      order: [['promotedAt', 'ASC']]
    })
    if (!product.promotedAt && promotedItems.length >= 5) {
      const productToUnpromote = promotedItems[0]
      productToUnpromote.promotedAt = null
      productToUnpromote.save()
    }
    return next()
  } catch (err) {
    return Promise.reject(new Error(err))
  }
}

export { checkProductOwnership, checkProductRestaurantOwnership, checkProductHasNotBeenOrdered, checkPromotedProducts }
