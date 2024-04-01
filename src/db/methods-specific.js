import { Op } from 'sequelize';

export default function createSpecificDbMethods(sequelize, models) {
  const file = {
    deleteBySystemName: systemName => {
      return models.file.destroy({
        where: { systemName },
      });
    },
    getBySystemName: systemName => {
      return models.file.findOne({
        where: { systemName },
      });
    },
  };

  const user = {
    getByEmailOrPhone: emailOrPhone => {
      return models.user.findOne({
        where: {
          [Op.or]: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        },
      });
    },
  };

  const refreshToken = {
    invalidateOld: token => {
      return models.refreshToken.destroy({
        where: { token },
      });
    },
    getByToken: token => {
      return models.refreshToken.findOne({
        where: { token },
      });
    },
  };

  return {
    file,
    user,
    refreshToken,
  };
}
