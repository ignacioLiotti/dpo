DELIMITER //

DROP PROCEDURE IF EXISTS insert_price_history //

CREATE PROCEDURE insert_price_history(
    IN p_element_id INT,
    IN p_price DECIMAL(10,2),
    IN p_valid_from DATE
)
BEGIN
    UPDATE prices 
    SET valid_to = DATE_SUB(p_valid_from, INTERVAL 1 DAY)
    WHERE element_id = p_element_id 
    AND valid_to IS NULL;
    
    INSERT INTO prices (element_id, price, valid_from)
    VALUES (p_element_id, p_price, p_valid_from);
END //

DELIMITER ;