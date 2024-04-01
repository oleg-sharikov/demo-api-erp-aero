export default function createCommonDbMethods(model) {
  function find(payload, options) {
    return model.findAll(payload, options);
  }

  function getById(id, options) {
    return model.findByPk(id, options);
  }

  function create(data, options) {
    return model.create(data, options);
  }

  function updateById(id, data, options) {
    return model.update(data, {
      where: {
        id,
      },
      ...options,
    });
  }

  function deleteById(id, options) {
    return model.destroy({
      where: {
        id,
      },
      ...options,
    });
  }

  function createMany(data, options) {
    return model.bulkCreate(data, options);
  }

  return {
    find,
    getById,
    create,
    updateById,
    deleteById,
    createMany,
  };
}
