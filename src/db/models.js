import { DataTypes } from 'sequelize';

export default async function createDBModels(sequelize) {
  const file = sequelize.define(
    'files',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      systemName: {
        type: DataTypes.CHAR(64),
        allowNull: false,
      },
      originalName: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sizeBytes: {
        type: DataTypes.BIGINT({ unsigned: true }),
        allowNull: false,
      },
      mime: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      extension: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['systemName'],
        },
      ],
    },
  );

  const user = sequelize.define(
    'users',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
      },
      phone: {
        type: DataTypes.STRING,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
      ],
      validate: {
        emailAndPhoneEmpty() {
          if (!this.email && !this.phone) {
            throw new Error('Email and phone cannot be empty!');
          }
        },
      },
    },
  );

  const refreshToken = sequelize.define(
    'refreshTokens',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['token'],
        },
      ],
    },
  );

  user.hasMany(file, {
    foreignKey: 'userId',
  });
  file.belongsTo(user);

  user.hasMany(refreshToken, {
    foreignKey: 'userId',
  });
  refreshToken.belongsTo(user);

  return {
    file,
    user,
    refreshToken,
  };
}
