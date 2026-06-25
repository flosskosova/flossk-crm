using System.Security.Cryptography;
using System.Text;

namespace FlosskMS.Business.Services;

public class EncryptionService : IEncryptionService
{
    private readonly IEncryptionKeyStore _keyStore;
    private const string Prefix = "$AES$";

    public EncryptionService(IEncryptionKeyStore keyStore)
    {
        _keyStore = keyStore;
    }

    public string Encrypt(string plaintext)
    {
        if (string.IsNullOrEmpty(plaintext))
            return plaintext;

        var (keyId, key) = _keyStore.GetActiveKey();
        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var nonce = RandomNumberGenerator.GetBytes(12);
        var ciphertext = new byte[plaintextBytes.Length];
        var tag = new byte[16];

        using var aes = new AesGcm(key, 16);
        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        var result = new byte[12 + ciphertext.Length + 16];
        Buffer.BlockCopy(nonce, 0, result, 0, 12);
        Buffer.BlockCopy(ciphertext, 0, result, 12, ciphertext.Length);
        Buffer.BlockCopy(tag, 0, result, 12 + ciphertext.Length, 16);

        return $"{Prefix}{keyId}${Convert.ToBase64String(result)}";
    }

    public string Decrypt(string ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext))
            return ciphertext;

        if (!ciphertext.StartsWith(Prefix))
            return ciphertext;

        var withoutPrefix = ciphertext[Prefix.Length..];

        var dollarIndex = withoutPrefix.IndexOf('$');
        if (dollarIndex < 0)
            return ciphertext;

        var keyId = withoutPrefix[..dollarIndex];
        var raw = Convert.FromBase64String(withoutPrefix[(dollarIndex + 1)..]);

        var key = _keyStore.GetKey(keyId);

        var nonce = raw.AsSpan(0, 12);
        var ct = raw.AsSpan(12, raw.Length - 12 - 16);
        var tag = raw.AsSpan(raw.Length - 16, 16);
        var plaintext = new byte[ct.Length];

        using var aes = new AesGcm(key, 16);
        aes.Decrypt(nonce, ct, tag, plaintext);

        return Encoding.UTF8.GetString(plaintext);
    }
}
