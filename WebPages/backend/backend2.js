// List all shipments
app.get('/shipments', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    db.all(`SELECT s.id, o.id AS 'order_id', shipment_method, shipment_date, shipment_address 
      FROM shipments s
      JOIN orders o ON o.shipment_id = s.id
      WHERE o.customer_id = ?`, [userId], 
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        res.json(rows);
    });
});

// Add shipment
app.post('/shipments', authenticateToken, (req, res) => {
    const { shipment_method, shipment_date, shipment_address } = req.body;

    if (!shipment_method || !shipment_date || !shipment_address) {
        return res.status(400).json({ message: "All fields are required." });
    }

    db.run(
        "INSERT INTO shipments (shipment_method, shipment_date, shipment_address) VALUES (?, ?, ?)",
        [shipment_method, shipment_date, shipment_address],
        function (err) {
            if (err) return res.status(500).json({ message: 'Failed to add shipment', error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Update Shipment ID in Orders Table
app.put('/orders/:orderId/shipment', authenticateToken, (req, res) => {
    const { shipmentId } = req.body;
    const orderId = req.params.orderId;

    if (!shipmentId) {
        return res.status(400).json({ message: "Shipment ID is required." });
    }

    db.run(
        "UPDATE orders SET shipment_id = ? WHERE id = ?",
        [shipmentId, orderId],
        function (err) {
            if (err) return res.status(500).json({ message: 'Failed to update order with shipment', error: err.message });
            res.json({ message: "Order updated with shipment ID" });
        }
    );
});

// Get specific shipment
app.get('/shipments/:id', authenticateToken, (req, res) => {
    const shipmentId = req.params.id;
    db.get(`SELECT shipment_method, shipment_date, shipment_address 
      FROM shipments
      WHERE id = ?`, [shipmentId], 
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        res.json(rows);
    });
});

// Edit shipment
app.put('/shipments/:id', authenticateToken, (req, res) => {
    const { shipment_method, shipment_date, shipment_address } = req.body;
    const shipmentId = req.params.id;

    db.run(
        "UPDATE shipments SET shipment_method = ?, shipment_date = ?, shipment_address = ? WHERE id = ?",
        [shipment_method, shipment_date, shipment_address, shipmentId],
        function (err) {
            if (err) return res.status(500).json({ message: 'Failed to update shipment', error: err.message });
            res.json({ message: "Shipment details updated" });
        }
    );
});

// Delete a shipment
app.delete('/shipments/:id', authenticateToken, (req, res) => {
    const shipmentId = req.params.id;

    db.run(
        "DELETE FROM shipments WHERE id = ?",
        [shipmentId],
        function (err) {
            if (err) return res.status(500).json({ message: 'Failed to delete shipment', error: err.message });
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Shipment not found.' });
            }
            res.json({ message: "Shipment deleted" });
        }
    );
});