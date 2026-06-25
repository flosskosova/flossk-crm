namespace FlosskMS.Business.Services;

public interface IEncryptionKeyStore
{
    string ActiveKeyId { get; }
    (string keyId, byte[] key) GetActiveKey();
    byte[] GetKey(string keyId);
    string AddNewKey();
    void RemoveKey(string keyId);
}
