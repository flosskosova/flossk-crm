using System.Formats.Cbor;
using System.Security.Cryptography;
using System.Text;

namespace FlosskMS.Business.Services;

public static class WebAuthnHelper
{
    public static (ECDsa? ecdsa, RSA? rsa) ParseCosePublicKey(byte[] authData)
    {
        int offset = 0;

        offset += 32;
        offset += 1;
        offset += 4;

        offset += 16;
        var credIdLen = (authData[offset] << 8) | authData[offset + 1];
        offset += 2;
        offset += credIdLen;

        var coseKey = new CborReader(authData[offset..]);

        var mapEntries = coseKey.ReadStartMap().GetValueOrDefault(0);

        long? keyType = null, algorithm = null;
        byte[]? x = null, y = null;
        byte[]? n = null, e = null;

        for (int i = 0; i < mapEntries; i++)
        {
            var label = coseKey.ReadInt64();
            switch (label)
            {
                case 1:
                    keyType = coseKey.ReadInt64();
                    break;
                case 3:
                    algorithm = coseKey.ReadInt64();
                    break;
                case -1:
                    coseKey.ReadInt64();
                    break;
                case -2:
                    if (keyType == 2)
                        x = coseKey.ReadByteString();
                    else
                        n = coseKey.ReadByteString();
                    break;
                case -3:
                    if (keyType == 2)
                        y = coseKey.ReadByteString();
                    else
                        e = coseKey.ReadByteString();
                    break;
                default:
                    coseKey.SkipValue();
                    break;
            }
        }

        if (algorithm == -7 && x != null && y != null)
        {
            var ecParams = new ECParameters
            {
                Curve = ECCurve.NamedCurves.nistP256,
                Q = { X = x, Y = y }
            };
            return (ECDsa.Create(ecParams), null);
        }

        if (algorithm == -257 && n != null && e != null)
        {
            var rsa = RSA.Create();
            rsa.ImportParameters(new RSAParameters
            {
                Modulus = n,
                Exponent = e
            });
            return (null, rsa);
        }

        return (null, null);
    }

    public static byte[] ExtractAuthDataFromAttestationObject(byte[] attestationObject)
    {
        var reader = new CborReader(attestationObject);
        reader.ReadStartMap();

        while (reader.PeekState() != CborReaderState.EndMap)
        {
            if (reader.ReadTextString() == "authData")
                return reader.ReadByteString();
            reader.SkipValue();
        }

        throw new InvalidOperationException("Could not find authData in attestationObject");
    }

    public static bool VerifyAssertion(
        byte[] authenticatorData,
        byte[] clientDataJson,
        byte[] signature,
        ECDsa? ecdsa,
        RSA? rsa)
    {
        var clientDataHash = SHA256.HashData(clientDataJson);

        var signedData = new byte[authenticatorData.Length + clientDataHash.Length];
        Buffer.BlockCopy(authenticatorData, 0, signedData, 0, authenticatorData.Length);
        Buffer.BlockCopy(clientDataHash, 0, signedData, authenticatorData.Length, clientDataHash.Length);

        if (ecdsa != null)
            return ecdsa.VerifyData(signedData, signature, HashAlgorithmName.SHA256, DSASignatureFormat.Rfc3279DerSequence);

        if (rsa != null)
            return rsa.VerifyData(signedData, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

        return false;
    }

    public static string ExtractChallengeFromClientDataJson(byte[] clientDataJson)
    {
        var json = Encoding.UTF8.GetString(clientDataJson);
        var doc = System.Text.Json.JsonDocument.Parse(json);
        var challenge = doc.RootElement.GetProperty("challenge").GetString() ?? "";

        return challenge;
    }

    public static byte[] Base64UrlDecode(string input)
    {
        var padded = input.Replace('-', '+').Replace('_', '/');
        switch (padded.Length % 4)
        {
            case 2: padded += "=="; break;
            case 3: padded += "="; break;
        }
        return Convert.FromBase64String(padded);
    }

    public static string Base64UrlEncode(byte[] input)
    {
        return Convert.ToBase64String(input)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }
}
