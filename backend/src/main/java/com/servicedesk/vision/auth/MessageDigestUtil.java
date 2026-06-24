package com.servicedesk.vision.auth;

import java.security.MessageDigest;

final class MessageDigestUtil {

    private MessageDigestUtil() {
    }

    static boolean equals(byte[] left, byte[] right) {
        return MessageDigest.isEqual(left, right);
    }
}
