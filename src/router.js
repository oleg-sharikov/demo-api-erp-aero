export default async function createRouter({ server, controller, validator }) {
  const {
    authenticateByToken,
    signIn,
    signUp,
    logOut,
    getNewAccessToken,
    getUserInfo,
    fileUpload,
    createFile,
    getFile,
    listFiles,
    deleteFile,
    updateFile,
  } = controller;

  const { validate, schema } = validator;

  server.post('/signup', validate(schema.signUp), signUp);

  server.post('/signin', validate(schema.signIn), signIn);

  server.post('/token', getNewAccessToken);

  server.get('/info', authenticateByToken, getUserInfo);

  server.get('/logout', authenticateByToken, logOut);

  server.post(
    '/file',
    authenticateByToken,
    fileUpload.single('userFile'),
    validate(schema.createFile),
    createFile,
  );

  server.get('/file/:fileId', authenticateByToken, validate(schema.getFile), getFile);

  server.get('/file', authenticateByToken, validate(schema.listFiles), listFiles);

  server.delete('/file/:fileId', authenticateByToken, validate(schema.deleteFile), deleteFile);

  server.put(
    '/file/:fileId',
    authenticateByToken,
    fileUpload.single('userFile'),
    validate(schema.updateFile),
    updateFile,
  );

  server.all('*', (req, res) => {
    res.status(404).send('page_not_found');
  });
}
